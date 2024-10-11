#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const crawlWebsite = require('./lib/crawler');
const logger = require('./lib/logger');
const path = require('path');
const fs = require('fs-extra');

const program = new Command();

program
  .version('3.0.0')
  .description('JSON-LD Schema Generator for Websites');

program
  .option('-u, --url <url>', 'Website URL to crawl')
  .option('-o, --output <directory>', 'Output directory for schemas', 'schemas')
  .option('-l, --log <directory>', 'Log directory', 'logs')
  .option('-d, --delay <milliseconds>', 'Delay between requests', parseInt, 1000)
  .option('-r, --respect-robots', 'Respect robots.txt rules', true)
  .option('-c, --concurrency <number>', 'Number of concurrent requests', parseInt, 5)
  .option('-f, --config-file <path>', 'Path to configuration file')
  .parse(process.argv);

(async () => {
  let options = program.opts();

  // Load configurations from file if provided
  if (options.configFile) {
    const configPath = path.resolve(options.configFile);
    if (fs.existsSync(configPath)) {
      const config = require(configPath);
      options = { ...options, ...config };
    } else {
      console.error(`Configuration file not found at ${configPath}`);
      process.exit(1);
    }
  }

  if (!options.url) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter the website URL to crawl:',
        validate: function (value) {
          const valid = value.startsWith('http://') || value.startsWith('https://');
          return valid || 'Please enter a valid URL (starting with http:// or https://)';
        },
      },
    ]);
    options.url = answers.url;
  }

  // Set up logging directories
  logger.configureLogger(options.log);

  try {
    await crawlWebsite(options);
  } catch (error) {
    logger.error(`Fatal error: ${error.stack}`);
  }
})();
