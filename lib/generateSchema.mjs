import { load } from 'cheerio';
import { validateSchema } from './schemaValidator.mjs';

// Function to generate the schema based on the page type
export default async function generateSchema(url, html, logger) {
  const $ = load(html);
  const pageType = determinePageType($);
  let schema;

  // Switch statement to generate schema based on the page type
  switch (pageType) {
    case 'Home':
      schema = generateHomeSchema($, url, logger);
      break;
    case 'About':
      schema = generateAboutSchema($, url, logger);
      break;
    case 'FAQ':
      schema = generateFAQSchema($, url, logger);
      break;
    case 'Services':
      schema = generateServicesSchema($, url, logger);
      break;
    case 'Contact':
      schema = generateContactSchema($, url, logger);
      break;
    case 'Blog':
      schema = generateBlogSchema($, url, logger);
      break;
    default:
      schema = generateDefaultSchema($, url, logger);
      break;
  }

  // Add breadcrumb list schema to each page type
  schema.breadcrumbList = generateBreadcrumbList($);

  // Add isPartOf property for WebPage schema
  if (schema['@type'] === 'WebPage') {
    schema.isPartOf = {
      '@type': 'WebSite',
      'name': $('h1').text() || 'Website',
      'url': url,
      'publisher': generatePublisher($, url)
    };
  }

  return schema;
}

// Function to determine the type of the page
function determinePageType($) {
  const pageTypeRegex = {
    Home: /<title>Home|<h1>Home|<h2>Home/,
    About: /<title>About|<h1>About|<h2>About/,
    FAQ: /<title>FAQ|<h1>FAQ|<h2>FAQ/,
    Services: /<title>Services|<h1>Services|<h2>Services/,
    Contact: /<title>Contact|<h1>Contact|<h2>Contact/,
    Blog: /<title>Blog|<h1>Blog|<h2>Blog/
  };

  for (const pageType in pageTypeRegex) {
    if (pageTypeRegex[pageType].test($.html())) {
      return pageType;
    }
  }

  return 'Default';
}

// Function to generate the schema for the homepage
function generateHomeSchema($, url, logger) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': extractPageTitle($),
    'description': extractMetaDescription($),
    'image': extractFirstImage($) || 'https://shopcitrotech.com/wp-content/uploads/2024/09/cropped-logo-2.png',
    'url': url,
    'breadcrumbList': generateBreadcrumbList($),
    'publisher': generatePublisher($, url),
    'contactPoint': generateContactPoint($),
    'address': extractAddress($),
    'geo': extractGeoCoordinates($),
    'sameAs': extractSocialMediaLinks($),
    'potentialAction': generateSearchAction($, url),
    'inLanguage': 'en'
  };
}

// Helper function to extract page title
function extractPageTitle($) {
  return $('title').text().trim() || 'Homepage';
}

// Helper function to extract meta description
function extractMetaDescription($) {
  return $('meta[name="description"]').attr('content') || 'Description not available';
}

// Helper function to extract the first image on the page
function extractFirstImage($) {
  return $('img').first().attr('src') || '';
}

// Helper function to extract phone numbers
function extractPhoneNumbers($) {
  const phoneRegex = /(\+?\d{1,2}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
  const phoneMatch = $.html().match(phoneRegex);
  return phoneMatch ? phoneMatch[0].trim() : null;
}

// Helper function to extract email addresses
function extractEmail($) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatch = $.html().match(emailRegex);
  return emailMatch ? emailMatch[0] : 'info@citrotech.com';
}

// Helper function to extract contact information (phone, email)
function generateContactPoint($) {
  const phoneNumber = extractPhoneNumbers($);
  const email = extractEmail($);

  if (phoneNumber || email) {
    return {
      '@type': 'ContactPoint',
      'telephone': phoneNumber || 'Not available',
      'email': email || 'info@citrotech.com',
      'contactType': 'Customer Service',
      'areaServed': 'US',
      'availableLanguage': 'English'
    };
  }

  return null;
}

// Helper function to extract address
function extractAddress($) {
  const streetRegex = /\d+\s[A-Za-z]+\s[A-Za-z]+/g;
  const localityRegex = /[A-Za-z]+\s[A-Za-z]+,\s[A-Z]{2}/g;
  const postalCodeRegex = /\d{5}/g;

  const streetMatch = $.html().match(streetRegex);
  const localityMatch = $.html().match(localityRegex);
  const postalCodeMatch = $.html().match(postalCodeRegex);

  if (streetMatch || localityMatch || postalCodeMatch) {
    return {
      '@type': 'PostalAddress',
      'streetAddress': streetMatch ? streetMatch[0] : 'Unknown Street',
      'addressLocality': localityMatch ? localityMatch[0].split(',')[0].trim() : 'Unknown City',
      'addressRegion': localityMatch ? localityMatch[0].split(',')[1].trim() : 'Unknown State',
      'postalCode': postalCodeMatch ? postalCodeMatch[0] : '00000',
      'addressCountry': 'US'
    };
  }

  return null;
}

// Helper function to extract geo coordinates
function extractGeoCoordinates($) {
  const latMatch = $.html().match(/lat(?:itude)?:\s*(-?\d+(\.\d+)?)/i);
  const lonMatch = $.html().match(/lon(?:gitude)?:\s*(-?\d+(\.\d+)?)/i);

  if (latMatch && lonMatch) {
    return {
      '@type': 'GeoCoordinates',
      'latitude': latMatch[1],
      'longitude': lonMatch[1]
    };
  }
  return null;
}

// Helper function to extract social media links
function extractSocialMediaLinks($) {
  const socialMediaLinks = [];
  $('a[href]').each((index, link) => {
    const href = $(link).attr('href');
    if (href.includes('facebook') || href.includes('linkedin') || href.includes('instagram')) {
      socialMediaLinks.push(href);
    }
  });
  return socialMediaLinks;
}

// Helper function to generate publisher information dynamically
function generatePublisher($, url) {
  const siteName = $('meta[property="og:site_name"]').attr('content') || $('title').text() || 'Website';
  const orgName = $('meta[property="og:site_name"]').attr('content') || 'Organization Name';
  const logo = $('img').first().attr('src') || 'https://example.com/logo.png';

  return {
    '@type': 'Organization',
    'name': orgName,
    'legalName': orgName,
    'url': url,
    '@id': url,
    'logo': logo,
    'sameAs': [
      'https://www.facebook.com/' + siteName.toLowerCase().replace(' ', ''),
      'https://www.linkedin.com/company/' + siteName.toLowerCase().replace(' ', ''),
      'https://www.instagram.com/' + siteName.toLowerCase().replace(' ', '')
    ]
  };
}

// Helper function to generate breadcrumb list
function generateBreadcrumbList($) {
  const breadcrumbList = {
    '@type': 'BreadcrumbList',
    'itemListElement': []
  };

  $('nav.breadcrumb a').each((index, crumb) => {
    breadcrumbList.itemListElement.push({
      '@type': 'ListItem',
      'position': index + 1,
      'name': $(crumb).text().trim(),
      'item': {
        '@id': $(crumb).attr('href'),
        'name': $(crumb).text().trim()
      }
    });
  });

  return breadcrumbList;
}

// Helper function to generate search action schema
function generateSearchAction($, url) {
  const searchForm = $('form[action*="search"], input[type="search"]');
  if (searchForm.length > 0) {
    const searchTarget = searchForm.attr('action') || url;
    return {
      '@type': 'SearchAction',
      'target': `${searchTarget}?s={search_term_string}`,
      'query-input': 'required name=search_term_string'
    };
  }
  return null;
}

// Function to generate the schema for the about page
function generateAboutSchema($, url, logger) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    'name': extractPageTitle($),
    'description': extractMetaDescription($),
    'url': url,
    'breadcrumbList': generateBreadcrumbList($),
    'publisher': generatePublisher($, url)
  };
}

// Function to generate the schema for the FAQ page
function generateFAQSchema($, url, logger) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'name': extractPageTitle($),
    'description': extractMetaDescription($),
    'url': url,
    'breadcrumbList': generateBreadcrumbList($),
    'publisher': generatePublisher($, url)
  };
}

// Function to generate the schema for the services page
function generateServicesSchema($, url, logger) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': extractPageTitle($),
    'description': extractMetaDescription($),
    'url': url,
    'breadcrumbList': generateBreadcrumbList($),
    'publisher': generatePublisher($, url)
  };
}

// Function to generate the schema for the contact page
function generateContactSchema($, url, logger) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    'name': extractPageTitle($),
    'description': extractMetaDescription($),
    'url': url,
    'breadcrumbList': generateBreadcrumbList($),
    'publisher': generatePublisher($, url),
    'contactPoint': generateContactPoint($)
  };
}

// Function to generate the schema for the blog page
function generateBlogSchema($, url, logger) {
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': extractPageTitle($),
    'description': extractMetaDescription($),
    'url': url,
    'breadcrumbList': generateBreadcrumbList($),
    'publisher': generatePublisher($, url)
  };

  // Extract blog posts dynamically
  const blogPosts = [];
  $('article').each((index, element) => {
    const postTitle = $(element).find('h2').text();
    const postUrl = $(element).find('a').attr('href');
    const postDate = $(element).find('time').attr('datetime');

    if (postTitle && postUrl) {
      blogPosts.push({
        '@type': 'BlogPosting',
        'name': postTitle,
        'url': postUrl,
        'datePublished': postDate || '',
        'image': $(element).find('img').attr('src') || ''
      });
    }
  });

  if (blogPosts.length > 0) {
    blogSchema['mainEntity'] = blogPosts;
  }

  return blogSchema;
}

// Function to generate the default schema
function generateDefaultSchema($, url, logger) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': extractPageTitle($),
    'description': extractMetaDescription($),
    'url': url,
    'breadcrumbList': generateBreadcrumbList($),
    'publisher': generatePublisher($, url)
  };
}

export { generateSchema };
