import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { generateSchema } from './generateSchema.mjs';

export default async function processPage(url, options, logger) {
  const { output } = options;

  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = load(html);

    const jsonLdScripts = $('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      logger.info(`Schema already exists for: ${url}`);
    } else {
      logger.info(`Generating schema for: ${url}`);
      const schema = await generateSchema(url, html, logger);
      if (schema) {
        const fileName = encodeURIComponent(url.replace(/https?:\/\//, '').replace(/\//g, '_')) + '.json';
        const filePath = path.join(output, fileName);

        // Ensure output directory exists
        fs.ensureDirSync(output);

        await fs.outputFile(filePath, JSON.stringify(schema, null, 2));
        logger.info(`Schema saved for: ${url} at ${filePath}`);
      } else {
        logger.warn(`No schema generated for: ${url}`);
      }
    }

    // Extract business hours
    const businessHours = extractBusinessHours($);
    if (businessHours) {
      logger.info(`Extracted business hours for: ${url}`);
    }

    // Extract pages
    const pages = extractPages($);
    if (pages) {
      logger.info(`Extracted pages for: ${url}`);
    }

    // Extract phone numbers
    const phoneNumbers = extractPhoneNumbers($);
    if (phoneNumbers) {
      logger.info(`Extracted phone numbers for: ${url}`);
    }

    // Extract address
    const address = extractAddress($);
    if (address) {
      logger.info(`Extracted address for: ${url}`);
    }

    // Extract email
    const email = extractEmail($);
    if (email) {
      logger.info(`Extracted email for: ${url}`);
    }

    // Extract social media links
    const socialMediaLinks = extractSocialMediaLinks($);
    if (socialMediaLinks) {
      logger.info(`Extracted social media links for: ${url}`);
    }

    // Extract reviews
    const reviews = extractReviews($);
    if (reviews) {
      logger.info(`Extracted reviews for: ${url}`);
    }

    // Extract ratings
    const ratings = extractRatings($);
    if (ratings) {
      logger.info(`Extracted ratings for: ${url}`);
    }
  } catch (error) {
    logger.error(`Error processing ${url}: ${error.stack}`);
    throw error;
  }
}

// Helper functions to extract information
function extractBusinessHours($) {
  // Use regular expressions to extract business hours from the page
  const hoursRegex = /Monday - Friday: (\d{1,2})am - (\d{1,2})pm/;
  const hoursMatch = $.html().match(hoursRegex);
  if (hoursMatch) {
    return {
      monday: hoursMatch[1],
      friday: hoursMatch[2],
    };
  }
  return null;
}

function extractPages($) {
  // Use cheerio to extract links to other pages on the website
  const links = $('a[href]');
  const pages = [];
  links.each((index, link) => {
    const href = $(link).attr('href');
    if (href && href.startsWith('/')) {
      pages.push(href);
    }
  });
  return pages;
}

function extractPhoneNumbers($) {
  // Use regular expressions to extract phone numbers from the page
  const phoneRegex = /\(\d{3}\) \d{3}-\d{4}/;
  const phoneMatch = $.html().match(phoneRegex);
  if (phoneMatch) {
    return phoneMatch[0];
  }
  return null;
}

function extractAddress($) {
  // Use regular expressions to extract address from the page
  const addressRegex = /\d{1,4} [a-zA-Z]+ [a-zA-Z]+, [a-zA-Z]+ \d{5}/;
  const addressMatch = $.html().match(addressRegex);
  if (addressMatch) {
    return addressMatch[0];
  }
  return null;
}

function extractEmail($) {
  // Use regular expressions to extract email from the page
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = $.html().match(emailRegex);
  if (emailMatch) {
    return emailMatch[0];
  }
  return null;
}

function extractSocialMediaLinks($) {
  // Use cheerio to extract social media links from the page
  const socialMediaLinks = [];
  const links = $('a[href]');
  links.each((index, link) => {
    const href = $(link).attr('href');
    if (href && (href.includes('facebook') || href.includes('twitter') || href.includes('instagram'))) {
      socialMediaLinks.push(href);
    }
  });
  return socialMediaLinks;
}

function extractReviews($) {
  // Use regular expressions to extract reviews from the page
  const reviewRegex = /<div class="review">.*?<\/div>/g;
  const reviewMatches = $.html().match(reviewRegex);
  if (reviewMatches) {
    const reviews = [];
    reviewMatches.forEach((review) => {
      const reviewText = review.replace(/<div class="review">|<\/div>/g, '');
      reviews.push(reviewText);
    });
    return reviews;
  }
  return null;
}

function extractRatings($) {
  // Use regular expressions to extract ratings from the page
  const ratingRegex = /<span class="rating">(\d{1,2})\/\d{1,2}<\/span>/g;
  const ratingMatches = $.html().match(ratingRegex);
  if (ratingMatches) {
    const ratings = [];
    ratingMatches.forEach((rating) => {
      const ratingValue = rating.replace(/<span class="rating">|<\/span>/g, '');
      ratings.push(ratingValue);
    });
    return ratings;
  }
  return null;
}