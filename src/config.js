module.exports = {
  // 扫描目录
  scanDirs: ['./src/views', './src/components'],
  
  // i18n文件路径
  i18nPath: './src/i18n/zh-CN.json',
  
  // 忽略的文件和目录
  ignore: ['node_modules', 'dist'],
  
  // 是否备份原文件
  backup: true,
  
  // 是否生成日志
  generateLog: true,
  
  // 日志路径
  logPath: './i18n-extract.log',
  
  // 备份目录
  backupDir: './i18n-backup',
  
  // 中文正则
  chineseRegex: /[\u4e00-\u9fa5]+/g,
  
  // 排除的内容模式
  excludePatterns: [
    /^\d+$/,  // 纯数字
    /^[a-zA-Z\s]+$/,  // 纯英文
    /^[!@#$%^&*()]+$/  // 特殊字符
  ]
}