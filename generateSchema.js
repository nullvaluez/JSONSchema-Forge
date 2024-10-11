const cheerio = require('cheerio');
const nlp = require('compromise');
const logger = require('./logger');
const { validateSchema } = require('./schemaValidator');

async function generateSchema(url, html) {
  const $ = cheerio.load(html);

  const pageType = determinePageType($, url);
  if (!pageType) {
    logger.warn(`Unable to determine page type for: ${url}`);
    return null;
  }

  let schema;
  switch (pageType) {
    case 'HomePage':
      schema = generateWebSiteSchema($, url);
      break;
    case 'AboutPage':
      schema = generateAboutPageSchema($, url);
      break;
    case 'ContactPage':
      schema = generateContactPageSchema($, url);
      break;
    case 'ServicesPage':
      schema = generateServicesSchema($, url);
      break;
    default:
      schema = generateDynamicSchema($, url);
      break;
  }

  // Validate the schema
  const isValid = validateSchema(schema);
  if (!isValid) {
    logger.error(`Generated schema is invalid for ${url}`);
    return null;
  }

  return schema;
}

function determinePageType($, url) {
  const urlPath = new URL(url).pathname.toLowerCase();

  const pageTypePatterns = {
    HomePage: ['/', '/home', '/index'],
    AboutPage: ['/about', '/about-us', '/who-we-are', '/company'],
    ContactPage: ['/contact', '/contact-us', '/contactus', '/get-in-touch', '/getintouch', '/support'],
    ServicesPage: ['/services', '/our-services', '/what-we-do', '/offerings', '/solutions'],
    // Add more patterns as needed
  };

  for (const [type, patterns] of Object.entries(pageTypePatterns)) {
    if (patterns.some(pattern => urlPath === pattern || urlPath.endsWith(pattern))) {
      return type;
    }
  }

  // Additional content-based detection
  const pageContent = $('body').text().toLowerCase();
  if (pageContent.includes('contact us') || pageContent.includes('get in touch')) {
    return 'ContactPage';
  }
  if (pageContent.includes('about us') || pageContent.includes('our company')) {
    return 'AboutPage';
  }
  if (pageContent.includes('services') || pageContent.includes('what we do')) {
    return 'ServicesPage';
  }

  // Fallback to dynamic detection
  return null;
}

// Schema generation functions as before...

module.exports = generateSchema;
