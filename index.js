/**
 * SeeEmEss - A simple CMS built on Eleventy
 *
 * @example
 * // In your eleventy.config.js:
 * import filters from 'seeemess/filters';
 * export default function(eleventyConfig) {
 *   filters(eleventyConfig);
 * }
 *
 * @example
 * // In your admin/start.js:
 * import { startAdminServer, createConfig } from 'seeemess';
 *
 * startAdminServer({
 *   sections: [
 *     { id: 'posts', name: 'Blog Posts', folder: 'posts', tag: 'post' }
 *   ]
 * });
 */

// Admin server and configuration
export { startAdminServer, createConfig } from './admin/server.js';

// Eleventy filters
export { default as filters } from './_config/filters.js';

// Re-export config utilities for advanced usage
export { getConfig, getContentDir, getPublicDir, getSections } from './admin/config.js';
