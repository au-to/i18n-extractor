import fs from 'fs/promises';
import glob from 'glob';
import parser from '@vue/compiler-sfc';
import { logger, backup, writeLog, shouldTranslate, generateKey } from './utils.js';

/**
 * i18n 提取器类
 * 用于从 Vue 文件中提取中文文本并转换为国际化格式
 */
class I18nExtractor {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    this.config = config;           // 存储配置信息
    this.i18nMap = {};             // 用于存储提取的中文文本及其对应的 key
    this.processedFiles = new Set();  // 用于记录已处理的文件
  }

  /**
   * 处理单个 Vue 文件
   * @param {string} filePath - Vue 文件路径
   */
  async processVueFile (filePath) {
    try {
      // 读取文件内容
      const content = await fs.readFile(filePath, 'utf-8');
      // 使用 Vue 解析器解析文件内容
      const { descriptor } = parser.parse(content);

      // 如果配置了备份选项，则进行文件备份
      if (this.config.backup) {
        await backup(filePath, this.config.backupDir);
      }

      // 如果存在模板部分，提取模板中的中文
      if (descriptor.template) {
        this.extractFromTemplate(descriptor.template.content, filePath);
      }

      // 如果存在脚本部分，提取脚本中的中文
      if (descriptor.script) {
        this.extractFromScript(descriptor.script.content, filePath);
      }

      // 使用提取的中文替换文件内容
      await this.replaceInFile(filePath, content);

      // 将文件添加到已处理集合中
      this.processedFiles.add(filePath);

      // 如果配置了日志生成，记录处理信息
      if (this.config.generateLog) {
        await writeLog(this.config.logPath, `Processed: ${filePath}`);
      }

      // 输出成功信息
      logger.success(`Successfully processed: ${filePath}`);
    } catch (error) {
      // 错误处理：记录错误信息
      logger.error(`Error processing ${filePath}: ${error.message}`);
      if (this.config.generateLog) {
        await writeLog(this.config.logPath, `Error: ${filePath} - ${error.message}`);
      }
    }
  }

  /**
   * 从内容中提取非注释的中文文本
   * @param {string} content - 要处理的内容
   * @returns {string[]} 提取的中文文本数组
   */
  extractChineseFromContent(content) {
    // 先将所有注释替换为空格
    let processedContent = content
      .replace(this.config.chineseExtraction.commentRegex.singleLine, '')
      .replace(this.config.chineseExtraction.commentRegex.multiLine, '');

    // 然后提取中文文本
    return processedContent.match(this.config.chineseExtraction.chineseRegex) || [];
  }

  /**
   * 从模板中提取中文文本
   * @param {string} content - 模板内容
   * @param {string} filePath - 文件路径
   */
  async extractFromTemplate (content, filePath) {
    const matches = this.extractChineseFromContent(content);
    for (const text of matches) {
      if (shouldTranslate(text, this.config.excludePatterns)) {
        const key = await this.generateAIKey(text);
        this.i18nMap[key] = text;
      }
    }
  }

  /**
   * 从脚本中提取中文文本
   * @param {string} content - 脚本内容
   * @param {string} filePath - 文件路径
   */
  async extractFromScript (content, filePath) {
    const matches = this.extractChineseFromContent(content);
    for (const text of matches) {
      if (shouldTranslate(text, this.config.excludePatterns)) {
        const key = await this.generateAIKey(text);
        this.i18nMap[key] = text;
      }
    }
  }

  /**
   * 使用AI生成国际化键名
   * @param {string} text - 中文文本
   * @returns {Promise<string>} 生成的键名
   */
  async generateAIKey (text) {
    try {
      // 调用大模型API生成键名
      const response = await fetch('你的AI接口地址', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.aiApiKey}`
        },
        body: JSON.stringify({
          prompt: `请将以下中文文本转换为合适的i18n键名（使用小驼峰命名法，纯英文）："${text}"`,
          max_tokens: 50
        })
      });

      const data = await response.json();
      let key = data.choices[0].text.trim();

      // 确保键名符合规范
      key = key.replace(/[^a-zA-Z0-9]/g, '');
      if (!key) {
        // 如果AI生成的键名无效，使用后备的生成方法
        return generateKey(text);
      }

      return key;
    } catch (error) {
      logger.warn(`AI key generation failed for "${text}": ${error.message}`);
      // 发生错误时使用原有的生成方法
      return generateKey(text);
    }
  }

  /**
   * 替换文件中的中文文本
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   */
  async replaceInFile (filePath, content) {
    let newContent = content;

    for (const [key, text] of Object.entries(this.i18nMap)) {
      // 替换模板中的双引号包裹的中文
      newContent = newContent.replace(
        new RegExp(`"${text}"`, 'g'),
        `"$t('${key}')"`
      );

      // 替换脚本中的单引号包裹的中文
      newContent = newContent.replace(
        new RegExp(`'${text}'`, 'g'),
        `this.$t('${key}')`
      );
    }

    // 将新内容写入文件
    await fs.writeFile(filePath, newContent, 'utf-8');
  }

  /**
   * 更新或创建 i18n 翻译文件
   */
  async updateI18nFile () {
    try {
      let existingI18n = {};
      // 尝试读取现有的 i18n 文件
      if (await fs.access(this.config.i18nPath).catch(() => false)) {
        const content = await fs.readFile(this.config.i18nPath, 'utf-8');
        existingI18n = JSON.parse(content);
      }

      // 合并现有翻译和新提取的翻译
      const newI18n = {
        ...existingI18n,
        ...this.i18nMap
      };

      // 将更新后的翻译写入文件
      await fs.writeFile(
        this.config.i18nPath,
        JSON.stringify(newI18n, null, 2),
        'utf-8'
      );

      logger.success('Successfully updated i18n file');
    } catch (error) {
      logger.error(`Error updating i18n file: ${error.message}`);
    }
  }

  /**
   * 运行提取器的主方法
   */
  async run () {
    logger.info('Starting i18n extraction...');

    // 遍历配置的扫描目录
    for (const dir of this.config.scanDirs) {
      // 使用 glob 匹配 Vue 文件
      const files = glob.sync(`${dir}/**/*.vue`, {
        ignore: this.config.ignore
      });

      // 处理每个匹配到的文件
      for (const file of files) {
        await this.processVueFile(file);
      }
    }

    // 更新 i18n 文件
    await this.updateI18nFile();

    // 输出处理统计信息
    logger.info('Extraction completed!');
    logger.info(`Processed files: ${this.processedFiles.size}`);
    logger.info(`Extracted texts: ${Object.keys(this.i18nMap).length}`);
  }
}

export default I18nExtractor