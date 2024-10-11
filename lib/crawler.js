const processPage = require('./processPage');
const logger = require('./logger');
const { getSitemapUrls } = require('./utils');
const pLimit = require('p-limit');
const { loadCrawledUrls, saveCrawledUrls } = require('./cache');
const robotsParser = require('robots-parser');
const axios = require('axios');

async function crawlWebsite(options) {
  const { url, delay, respectRobots, concurrency } = options;
  const crawledUrls = loadCrawledUrls();
  let urlsToCrawl = [];
  let robots;

  try {
    // Respect robots.txt
    if (respectRobots) {
      robots = await getRobotsParser(url);
    }

    // Fetch URLs from sitemap
    urlsToCrawl = await getSitemapUrls(url);

    // If no sitemap, fall back to starting URL
    if (urlsToCrawl.length === 0) {
      urlsToCrawl = [url];
    }

    // Remove URLs disallowed by robots.txt
    if (respectRobots && robots) {
      urlsToCrawl = urlsToCrawl.filter(u => robots.isAllowed(u, 'SchemaCrawlerBot'));
    }

    // Remove already crawled URLs
    urlsToCrawl = urlsToCrawl.filter(u => !crawledUrls.has(u));

    // Limit concurrency
    const limit = pLimit(concurrency);

    const crawlPromises = urlsToCrawl.map(u => limit(() => crawlUrl(u, options, crawledUrls, robots, delay)));

    await Promise.all(crawlPromises);

    // Save crawled URLs to cache
    saveCrawledUrls(crawledUrls);

    logger.info('Crawling completed.');
  } catch (error) {
    logger.error(`Error during crawling: ${error.stack}`);
  }
}

async function crawlUrl(url, options, crawledUrls, robots, delay) {
  if (crawledUrls.has(url)) return;
  crawledUrls.add(url);

  // Check robots.txt
  if (options.respectRobots && robots && !robots.isAllowed(url, 'SchemaCrawlerBot')) {
    logger.info(`Skipping disallowed URL by robots.txt: ${url}`);
    return;
  }

  await processPage(url, options);

  // Delay between requests
  await new Promise(resolve => setTimeout(resolve, delay));
}

async function getRobotsParser(baseUrl) {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const response = await axios.get(robotsUrl);
    return robotsParser(robotsUrl, response.data);
  } catch (error) {
    logger.warn(`Could not fetch robots.txt: ${error.message}`);
    return null;
  }
}

module.exports = crawlWebsite;
