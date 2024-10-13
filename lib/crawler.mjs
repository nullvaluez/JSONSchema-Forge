import processPage from './processPage.mjs';
import { getSitemapUrls } from './utils.mjs';
import pLimit from 'p-limit';
import { loadCrawledUrls, saveCrawledUrls } from './cache.mjs';
import robotsParser from 'robots-parser';
import axios from 'axios';

export default async function crawlWebsite(options, logger) {
  const { url, delay, respectRobots, concurrency } = options;
  const crawledUrls = loadCrawledUrls();
  let urlsToCrawl = [];
  let robots;

  try {
    // Respect robots.txt
    if (respectRobots) {
      robots = await getRobotsParser(url, logger);
    }

    // Fetch URLs from sitemap
    urlsToCrawl = await getSitemapUrls(url, logger);

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

    // Log number of URLs to crawl after filtering
    logger.info(`Number of URLs to crawl after filtering: ${urlsToCrawl.length}`);

    if (urlsToCrawl.length === 0) {
      logger.warn('No URLs to crawl after filtering. Exiting.');
      return;
    }

    // Limit concurrency
    const limit = pLimit(concurrency);

    const crawlPromises = urlsToCrawl.map(u =>
      limit(() => crawlUrl(u, options, crawledUrls, robots, delay, logger))
    );

    // Wait for all pages to be processed
    await Promise.all(crawlPromises);

    // Save crawled URLs to cache
    saveCrawledUrls(crawledUrls);

    logger.info('Crawling completed.');
  } catch (error) {
    logger.error(`Error during crawling: ${error.stack}`);
  }
}

async function crawlUrl(url, options, crawledUrls, robots, delay, logger) {
  if (crawledUrls.has(url)) return;

  // Check robots.txt
  if (options.respectRobots && robots && !robots.isAllowed(url, 'SchemaCrawlerBot')) {
    logger.info(`Skipping disallowed URL by robots.txt: ${url}`);
    return;
  }

  logger.info(`Processing URL: ${url}`);

  try {
    await processPage(url, options, logger);
    // Add URL to crawledUrls after successful processing
    crawledUrls.add(url);
  } catch (error) {
    logger.error(`Error processing ${url}: ${error.stack}`);
  }

  // Delay between requests
  await new Promise(resolve => setTimeout(resolve, delay));
}

async function getRobotsParser(baseUrl, logger) {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const response = await axios.get(robotsUrl);
    return robotsParser(robotsUrl, response.data);
  } catch (error) {
    logger.warn(`Could not fetch robots.txt: ${error.message}`);
    return null;
  }
}
