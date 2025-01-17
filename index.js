const I18nExtractor = require('./src/extractor');
const config = require('./src/config');

async function main() {
  try {
    const extractor = new I18nExtractor(config);
    await extractor.run();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main()