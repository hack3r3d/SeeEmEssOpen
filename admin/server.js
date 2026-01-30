import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Eta } from 'eta';

// Config
import { createConfig, getConfig, getCmsRoot, getPublicDir, getImageUrlPath, getPreviewTemplate, getTitle, getPort, getSections } from './config.js';

// Routes
import postsRouter from './routes/posts.js';
import imagesRouter from './routes/images.js';
import publishRouter, { publishChangesHandler } from './routes/publish.js';
import createPreviewRouter from './routes/preview.js';
import synopsisRouter from './routes/synopsis.js';

// Get the directory of this module (for locating templates)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Eta with templates directory
const eta = new Eta({
  views: join(__dirname, 'templates'),
  cache: process.env.NODE_ENV === 'production'
});

/**
 * Start the admin server with the provided configuration
 * @param {Object} options Configuration options (passed to createConfig)
 * @param {string} [options.cmsRoot] Root directory of the CMS project
 * @param {string} [options.contentDir] Content directory path
 * @param {string} [options.publicDir] Public/uploads directory path
 * @param {number} [options.port] Server port
 * @param {Array} options.sections Array of section definitions: { id, name, folder, tag }
 * @returns {Object} Object containing the express app and server instance
 */
export function startAdminServer(options = {}) {
  // Initialize config
  const config = createConfig(options);

  const app = express();

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static files - serve images at configured URL path
  const imageUrlPath = getImageUrlPath();
  app.use(imageUrlPath, express.static(getPublicDir()));
  app.use('/css', express.static(join(getCmsRoot(), 'css')));

  // Admin interface
  app.get('/', (req, res) => {
    res.send(eta.render('admin', { imageUrlPath, title: getTitle() }));
  });

  // API Routes
  app.get('/api/sections', (req, res) => {
    res.json(getSections());
  });

  app.use('/api/posts', postsRouter);
  app.use('/api/images', imagesRouter);
  app.use('/api/publish', publishRouter);
  app.use('/api/preview', createPreviewRouter(eta, imageUrlPath, getPreviewTemplate()));
  app.use('/api/generate-synopsis', synopsisRouter);
  app.post('/api/publish-changes', publishChangesHandler);

  // Start server
  const port = getPort();
  const server = app.listen(port, () => {
    console.log(`Admin server running at http://localhost:${port}`);
  });

  return { app, server, config };
}

// Export eta instance for use by other modules if needed
export { eta };

// Re-export createConfig for convenience
export { createConfig } from './config.js';
