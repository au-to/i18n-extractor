// 导出配置对象
export default {
  // 需要扫描的目录列表
  scanDirs: ['./src/test'],
  
  // i18n 翻译文件的存储路径
  i18nPath: './i18n/test/zh-CN.json',
  
  // 扫描时需要忽略的文件和目录
  ignore: ['node_modules', 'dist'],
  
  // 是否在处理文件前进行备份
  backup: false,
  
  // 是否生成处理日志
  generateLog: false,
  
  // 日志文件路径
  logPath: './i18n-extract.log',
  
  // 文件备份存储目录
  backupDir: './i18n-backup',
  
  // 用于匹配中文文本的配置
  chineseExtraction: {
    // 匹配中文字符
    chineseRegex: /[\u4e00-\u9fa5]+/g,
    
    // 匹配注释的正则表达式
    commentRegex: {
      // 单行注释
      singleLine: /\/\/.*/g,
      // 多行注释
      multiLine: /\/\*[\s\S]*?\*\//g
    }
  },
  
  // 不需要翻译的内容模式
  excludePatterns: [
    /^\d+$/,  // 纯数字
    /^[a-zA-Z\s]+$/,  // 纯英文
    /^[!@#$%^&*()]+$/  // 特殊字符
  ],

  // 大模型能力配置
  aiApiKey: '你的AI API密钥',
  aiEndpoint: 'AI服务的接口地址'
}