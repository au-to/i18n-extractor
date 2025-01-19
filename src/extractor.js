const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const parser = require('@vue/compiler-sfc');
const { logger, backup, writeLog, shouldTranslate, generateKey } = require('./utils');

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
  async processVueFile(filePath) {
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
   * 从模板中提取中文文本
   * @param {string} content - 模板内容
   * @param {string} filePath - 文件路径
   */
  extractFromTemplate(content, filePath) {
    // 使用中文正则表达式匹配内容
    const matches = content.match(this.config.chineseRegex) || [];
    for (const text of matches) {
      // 检查文本是否需要翻译（不在排除规则中）
      if (shouldTranslate(text, this.config.excludePatterns)) {
        const key = generateKey(text);
        this.i18nMap[key] = text;
      }
    }
  }

  /**
   * 从脚本中提取中文文本
   * @param {string} content - 脚本内容
   * @param {string} filePath - 文件路径
   */
  extractFromScript(content, filePath) {
    // 使用中文正则表达式匹配内容
    const matches = content.match(this.config.chineseRegex) || [];
    for (const text of matches) {
      // 检查文本是否需要翻译（不在排除规则中）
      if (shouldTranslate(text, this.config.excludePatterns)) {
        const key = generateKey(text);
        this.i18nMap[key] = text;
      }
    }
  }

  /**
   * 替换文件中的中文文本
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   */
  async replaceInFile(filePath, content) {
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
  async updateI18nFile() {
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
  async run() {
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

// 导出 I18nExtractor 类
module.exports = I18nExtractor