const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to be within the project.
  // This is useful for deployment environments where /var/www/ might not have write access to home.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
