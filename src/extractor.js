const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const parser = require('@vue/compiler-sfc');
const { logger, backup, writeLog, shouldTranslate, generateKey } = require('./utils');

class I18nExtractor {
  constructor(config) {
    this.config = config;
    this.i18nMap = {};
    this.processedFiles = new Set();
  }

  async processVueFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { descriptor } = parser.parse(content);
      
      if (this.config.backup) {
        await backup(filePath, this.config.backupDir);
      }

      // 提取模板中的中文
      if (descriptor.template) {
        this.extractFromTemplate(descriptor.template.content, filePath);
      }

      // 提取脚本中的中文
      if (descriptor.script) {
        this.extractFromScript(descriptor.script.content, filePath);
      }

      // 替换文件内容
      await this.replaceInFile(filePath, content);
      
      this.processedFiles.add(filePath);
      
      if (this.config.generateLog) {
        await writeLog(this.config.logPath, `Processed: ${filePath}`);
      }
      
      logger.success(`Successfully processed: ${filePath}`);
    } catch (error) {
      logger.error(`Error processing ${filePath}: ${error.message}`);
      if (this.config.generateLog) {
        await writeLog(this.config.logPath, `Error: ${filePath} - ${error.message}`);
      }
    }
  }

  extractFromTemplate(content, filePath) {
    const matches = content.match(this.config.chineseRegex) || [];
    for (const text of matches) {
      if (shouldTranslate(text, this.config.excludePatterns)) {
        const key = generateKey(text);
        this.i18nMap[key] = text;
      }
    }
  }

  extractFromScript(content, filePath) {
    const matches = content.match(this.config.chineseRegex) || [];
    for (const text of matches) {
      if (shouldTranslate(text, this.config.excludePatterns)) {
        const key = generateKey(text);
        this.i18nMap[key] = text;
      }
    }
  }

  async replaceInFile(filePath, content) {
    let newContent = content;
    
    for (const [key, text] of Object.entries(this.i18nMap)) {
      // 替换模板中的中文
      newContent = newContent.replace(
        new RegExp(`"${text}"`, 'g'),
        `"$t('${key}')"`
      );
      
      // 替换script中的中文
      newContent = newContent.replace(
        new RegExp(`'${text}'`, 'g'),
        `this.$t('${key}')`
      );
    }

    await fs.writeFile(filePath, newContent, 'utf-8');
  }

  async updateI18nFile() {
    try {
      let existingI18n = {};
      if (await fs.access(this.config.i18nPath).catch(() => false)) {
        const content = await fs.readFile(this.config.i18nPath, 'utf-8');
        existingI18n = JSON.parse(content);
      }

      const newI18n = {
        ...existingI18n,
        ...this.i18nMap
      };

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

  async run() {
    logger.info('Starting i18n extraction...');

    for (const dir of this.config.scanDirs) {
      const files = glob.sync(`${dir}/**/*.vue`, {
        ignore: this.config.ignore
      });

      for (const file of files) {
        await this.processVueFile(file);
      }
    }

    await this.updateI18nFile();
    
    logger.info('Extraction completed!');
    logger.info(`Processed files: ${this.processedFiles.size}`);
    logger.info(`Extracted texts: ${Object.keys(this.i18nMap).length}`);
  }
}

module.exports = I18nExtractor