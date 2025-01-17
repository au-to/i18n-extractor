const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

exports.logger = {
  info: (msg) => console.log(chalk.blue(msg)),
  success: (msg) => console.log(chalk.green(msg)),
  error: (msg) => console.log(chalk.red(msg)),
  warn: (msg) => console.log(chalk.yellow(msg))
};

exports.backup = async (filePath, backupDir) => {
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${fileName}.${Date.now()}.bak`);
  await fs.mkdir(backupDir, { recursive: true });
  await fs.copyFile(filePath, backupPath);
  return backupPath;
};

exports.writeLog = async (logPath, content) => {
  const timestamp = new Date().toISOString();
  const logContent = `[${timestamp}] ${content}\n`;
  await fs.appendFile(logPath, logContent);
};

exports.shouldTranslate = (text, excludePatterns) => {
  return !excludePatterns.some(pattern => pattern.test(text));
};

exports.generateKey = (text) => {
  // 生成简单的key
  return `text_${text.slice(0, 10)
    .replace(/[\s\u4e00-\u9fa5]/g, '_')
    .toLowerCase()}`;
}