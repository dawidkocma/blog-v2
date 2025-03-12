/**
 * Convert a string to a URL-friendly slug
 * @param {string} str - The string to convert
 * @param {string} separator - The separator to use (default: '-')
 * @returns {string} The slugified string
 */
function slugify(str, separator = '-') {
  return String(str)
    .normalize('NFKD') // Split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '') // Remove non-alphanumeric characters
    .replace(/\s+/g, separator) // Replace spaces with separator
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Remove duplicate separators
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), ''); // Remove leading/trailing separator
}

/**
 * Generate a unique slug based on a string and existing slugs
 * @param {string} str - The string to convert
 * @param {Array<string>} existingSlugs - Array of existing slugs to check against
 * @returns {string} A unique slug
 */
function generateUniqueSlug(str, existingSlugs = []) {
  let slug = slugify(str);
  let uniqueSlug = slug;
  let counter = 1;

  // Check if slug exists, if so, append a number
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

module.exports = slugify;
module.exports.generateUniqueSlug = generateUniqueSlug;