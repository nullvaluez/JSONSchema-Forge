#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import crawlWebsite from './lib/crawler.mjs';
import { configureLogger } from './lib/logger.mjs';
import path from 'path';
import fs from 'fs-extra';

const program = new Command();

program
  .version('1.0.0')
  .description('JSON-LD Schema Generator for Websites')
  .option('-u, --url <url>', 'Website URL to crawl')
  .option('-o, --output <directory>', 'Output directory for schemas', 'schemas')
  .option('-l, --log <directory>', 'Log directory', 'logs')
  .option('-d, --delay <milliseconds>', 'Delay between requests', parseInt, 1000)
  .option('--no-respect-robots', 'Ignore robots.txt rules')
  .option('-c, --concurrency <number>', 'Number of concurrent requests', parseInt, 5)
  .option('--clear-cache', 'Clear the crawled URLs cache before crawling', false)
  .parse(process.argv);

(async () => {
  let options = program.opts();

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
  const logger = configureLogger(options.log);

  // Clear cache if option is set
  if (options.clearCache) {
    fs.removeSync('cache/crawledUrls.json');
    logger.info('Cleared crawled URLs cache.');
  }

  try {
    await crawlWebsite(options, logger);
  } catch (error) {
    logger.error(`Fatal error: ${error.stack}`);
  }
})();
