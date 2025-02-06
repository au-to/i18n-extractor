import I18nExtractor from './src/extractor.js';
import config from './src/config.js';

/**
 * 主函数：初始化并运行提取器
 */
async function main() {
  try {
    const extractor = new I18nExtractor(config);
    await extractor.run();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();