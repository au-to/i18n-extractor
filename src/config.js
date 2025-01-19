// 导出配置对象
module.exports = {
  // 需要扫描的目录列表
  scanDirs: ['./src/routes', './src/components'],
  
  // i18n 翻译文件的存储路径
  i18nPath: './src/i18n/zh-CN.json',
  
  // 扫描时需要忽略的文件和目录
  ignore: ['node_modules', 'dist'],
  
  // 是否在处理文件前进行备份
  backup: true,
  
  // 是否生成处理日志
  generateLog: true,
  
  // 日志文件路径
  logPath: './i18n-extract.log',
  
  // 文件备份存储目录
  backupDir: './i18n-backup',
  
  // 用于匹配中文文本的正则表达式
  chineseRegex: /[\u4e00-\u9fa5]+/g,
  
  // 不需要翻译的内容模式
  excludePatterns: [
    /^\d+$/,  // 纯数字
    /^[a-zA-Z\s]+$/,  // 纯英文
    /^[!@#$%^&*()]+$/  // 特殊字符
  ]
}