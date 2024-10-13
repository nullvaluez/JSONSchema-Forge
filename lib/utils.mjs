import axios from 'axios';
import xml2js from 'xml2js';

export async function getSitemapUrls(baseUrl, logger) {
  try {
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
    const response = await axios.get(sitemapUrl);
    const sitemapData = await xml2js.parseStringPromise(response.data);
    let urls = [];

    if (sitemapData.urlset && sitemapData.urlset.url) {
      urls = sitemapData.urlset.url.map(entry => entry.loc[0]);
    } else if (sitemapData.sitemapindex && sitemapData.sitemapindex.sitemap) {
      // Handle sitemap index files
      const sitemaps = sitemapData.sitemapindex.sitemap.map(entry => entry.loc[0]);
      for (const smUrl of sitemaps) {
        const smResponse = await axios.get(smUrl);
        const smData = await xml2js.parseStringPromise(smResponse.data);
        if (smData.urlset && smData.urlset.url) {
          urls.push(...smData.urlset.url.map(entry => entry.loc[0]));
        }
      }
    }

    logger.info(`Fetched ${urls.length} URLs from sitemap.`);
    return urls;
  } catch (error) {
    logger.warn(`Could not fetch or parse sitemap.xml: ${error.message}`);
    return [];
  }
}
