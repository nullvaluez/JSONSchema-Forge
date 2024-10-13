import fs from 'fs-extra';
import path from 'path';

const cacheFilePath = path.join('cache', 'crawledUrls.json');

export function loadCrawledUrls() {
  if (fs.existsSync(cacheFilePath)) {
    return new Set(JSON.parse(fs.readFileSync(cacheFilePath)));
  }
  return new Set();
}

export function saveCrawledUrls(crawledUrls) {
  fs.ensureDirSync(path.dirname(cacheFilePath));
  fs.writeFileSync(cacheFilePath, JSON.stringify([...crawledUrls]));
}

export function cleanUpCrawledUrls(crawledUrls, logger) {
  crawledUrls.forEach(url => {
    if (!isValidUrl(url)) { // Implement a validation method for URLs.
      logger.info(`Removing invalid URL: ${url}`);
      crawledUrls.delete(url);
    }
  });
}
