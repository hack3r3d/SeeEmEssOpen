import { join } from 'path';

// Default configuration values
const DEFAULT_IMAGE_SIZES = [
  { suffix: '-thumb', width: 150 },
  { suffix: '-400', width: 400 },
  { suffix: '-600', width: 600 },
  { suffix: '-800', width: 800 }
];

const DEFAULT_BRANCH_WORDS = [
  'alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india',
  'juliet','kilo','lima','mike','november','oscar','papa','quebec','romeo',
  'sierra','tango','uniform','victor','whiskey','xray','yankee','zulu',
  'apple','banana','cherry','dragon','eagle','falcon','grape','hawk','iris',
  'jade','karma','lemon','mango','ninja','olive','pearl','quartz','ruby',
  'sage','tiger','ultra','violet','willow','xenon','yellow','zebra'
];

// Singleton config - set by createConfig()
let currentConfig = null;

/**
 * Create a configuration object for the CMS admin
 * @param {Object} options Configuration options
 * @param {string} [options.cmsRoot] Root directory of the CMS project (defaults to process.cwd())
 * @param {string} [options.contentDir] Content directory path (defaults to cmsRoot/content/blog)
 * @param {string} [options.publicDir] Public/uploads directory path (defaults to cmsRoot/public)
 * @param {string} [options.imageUrlPath] URL path prefix for images in final site (defaults to '/uploads')
 * @param {string} [options.previewTemplate] Path to custom preview template (relative to cmsRoot)
 * @param {number} [options.port] Server port (defaults to 3000 or PORT env var)
 * @param {Array} options.sections Array of section definitions: { id, name, folder, tag }
 * @param {Array} [options.imageSizes] Array of image size definitions: { suffix, width }
 * @param {Array} [options.branchWords] Array of words for git branch name generation
 * @returns {Object} Configuration object
 */
export function createConfig(options = {}) {
  const cmsRoot = options.cmsRoot || process.cwd();

  // Normalize imageUrlPath - ensure it starts with / and doesn't end with /
  let imageUrlPath = options.imageUrlPath || '/uploads';
  if (!imageUrlPath.startsWith('/')) imageUrlPath = '/' + imageUrlPath;
  if (imageUrlPath.endsWith('/')) imageUrlPath = imageUrlPath.slice(0, -1);

  const config = {
    CMS_ROOT: cmsRoot,
    CONTENT_DIR: options.contentDir || join(cmsRoot, 'content', 'blog'),
    PUBLIC_DIR: options.publicDir || join(cmsRoot, 'public'),
    IMAGE_URL_PATH: imageUrlPath,
    PREVIEW_TEMPLATE: options.previewTemplate ? join(cmsRoot, options.previewTemplate) : null,
    PORT: options.port || process.env.PORT || 3000,
    SECTIONS: options.sections || [],
    IMAGE_SIZES: options.imageSizes || DEFAULT_IMAGE_SIZES,
    BRANCH_WORDS: options.branchWords || DEFAULT_BRANCH_WORDS
  };

  // Set as current config for routes to access
  currentConfig = config;

  return config;
}

/**
 * Get the current configuration (must call createConfig first)
 * @returns {Object} Current configuration object
 * @throws {Error} If createConfig hasn't been called
 */
export function getConfig() {
  if (!currentConfig) {
    throw new Error('Config not initialized. Call createConfig() first.');
  }
  return currentConfig;
}

// Export individual getters for backward compatibility during migration
export const getCmsRoot = () => getConfig().CMS_ROOT;
export const getContentDir = () => getConfig().CONTENT_DIR;
export const getPublicDir = () => getConfig().PUBLIC_DIR;
export const getImageUrlPath = () => getConfig().IMAGE_URL_PATH;
export const getPreviewTemplate = () => getConfig().PREVIEW_TEMPLATE;
export const getPort = () => getConfig().PORT;
export const getSections = () => getConfig().SECTIONS;
export const getImageSizes = () => getConfig().IMAGE_SIZES;
export const getBranchWords = () => getConfig().BRANCH_WORDS;
