'use strict';

const ERROR_CODES = {
  VALIDATION_ERROR:            { code: 'VALIDATION_ERROR',            statusCode: 400 },
  UNAUTHORIZED:                { code: 'UNAUTHORIZED',                statusCode: 401 },
  FORBIDDEN:                   { code: 'FORBIDDEN',                   statusCode: 403 },
  RESOURCE_NOT_FOUND:          { code: 'RESOURCE_NOT_FOUND',          statusCode: 404 },
  DUPLICATE_EMAIL:             { code: 'DUPLICATE_EMAIL',             statusCode: 409 },
  DUPLICATE_CATEGORY:          { code: 'DUPLICATE_CATEGORY',          statusCode: 409 },
  CATEGORY_HAS_TODOS:          { code: 'CATEGORY_HAS_TODOS',          statusCode: 409 },
  DEFAULT_CATEGORY_IMMUTABLE:  { code: 'DEFAULT_CATEGORY_IMMUTABLE',  statusCode: 403 },
  INTERNAL_SERVER_ERROR:       { code: 'INTERNAL_SERVER_ERROR',       statusCode: 500 },
};

module.exports = { ERROR_CODES };
