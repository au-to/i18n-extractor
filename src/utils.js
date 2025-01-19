const fs = require('fs').promises;  // 文件系统模块的 Promise 版本
const path = require('path');       // 路径处理模块
const chalk = require('chalk');     // 终端彩色输出模块

// 日志工具对象，提供不同级别的彩色日志输出
exports.logger = {
  info: (msg) => console.log(chalk.blue(msg)),     // 信息级别
  success: (msg) => console.log(chalk.green(msg)), // 成功级别
  error: (msg) => console.log(chalk.red(msg)),     // 错误级别
  warn: (msg) => console.log(chalk.yellow(msg))    // 警告级别
};

/**
 * 备份文件的工具函数
 * @param {string} filePath - 需要备份的文件路径
 * @param {string} backupDir - 备份文件存储目录
 * @returns {Promise<string>} 返回备份文件的路径
 */
exports.backup = async (filePath, backupDir) => {
  const fileName = path.basename(filePath);
  // 生成带时间戳的备份文件名
  const backupPath = path.join(backupDir, `${fileName}.${Date.now()}.bak`);
  // 确保备份目录存在
  await fs.mkdir(backupDir, { recursive: true });
  // 复制文件到备份位置
  await fs.copyFile(filePath, backupPath);
  return backupPath;
};

/**
 * 写入日志的工具函数
 * @param {string} logPath - 日志文件路径
 * @param {string} content - 日志内容
 */
exports.writeLog = async (logPath, content) => {
  const timestamp = new Date().toISOString();
  // 格式化日志内容，添加时间戳
  const logContent = `[${timestamp}] ${content}\n`;
  // 追加写入日志文件
  await fs.appendFile(logPath, logContent);
};

/**
 * 判断文本是否需要翻译
 * @param {string} text - 待检查的文本
 * @param {RegExp[]} excludePatterns - 排除规则数组
 * @returns {boolean} 是否需要翻译
 */
exports.shouldTranslate = (text, excludePatterns) => {
  return !excludePatterns.some(pattern => pattern.test(text));
};

/**
 * 为文本生成翻译 key
 * @param {string} text - 原文本
 * @returns {string} 生成的 key
 */
exports.generateKey = (text) => {
  // 生成简单的 key：取前10个字符，替换空格和中文为下划线，转小写
  return `text_${text.slice(0, 10)
    .replace(/[\s\u4e00-\u9fa5]/g, '_')
    .toLowerCase()}`;
}