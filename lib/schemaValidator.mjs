export function validateSchema(schema, logger) {
  try {
    // Basic validation: check if schema is an object with '@context' and '@type'
    if (typeof schema === 'object' && schema['@context'] && schema['@type']) {
      return true;
    } else {
      logger.error('Schema validation failed: Missing @context or @type');
      return false;
    }
  } catch (error) {
    logger.error(`Schema validation error: ${error.stack}`);
    return false;
  }
}
