import { Router } from 'express';
import fs from 'fs';
import { join, parse as parsePath } from 'path';
import sharp from 'sharp';
import { getPublicDir, getImageSizes } from '../config.js';
import { runGit } from '../utils/git.js';

const router = Router();

// Track deleted images for git staging
export let deletedImages = [];

export function clearDeletedImages() {
  deletedImages = [];
}

// List images
router.get('/', (req, res) => {
  const images = fs.readdirSync(getPublicDir()).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
  res.json(images);
});

// Upload image (creates multiple sizes)
router.post('/', async (req, res) => {
  const { filename, data } = req.body;
  if (!filename || !data) return res.status(400).json({ error: 'Missing filename or data' });

  try {
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const parsed = parsePath(filename);
    const safeName = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '-');
    const ext = parsed.ext.toLowerCase() || '.jpg';

    // Save original
    const originalName = safeName + ext;
    const originalPath = join(getPublicDir(), originalName);
    fs.writeFileSync(originalPath, buffer);

    // Generate resized versions
    const generatedFiles = [originalName];
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    // Use sizes from config, but with different width thresholds
    const sizes = [
      { width: 800, suffix: '-800' },
      { width: 600, suffix: '-600' },
      { width: 400, suffix: '-400' },
      { width: 150, suffix: '-thumb' }
    ];

    for (const size of sizes) {
      if (metadata.width && metadata.width > size.width) {
        const resizedName = safeName + size.suffix + ext;
        const resizedPath = join(getPublicDir(), resizedName);

        await sharp(buffer)
          .resize(size.width, null, { withoutEnlargement: true })
          .toFile(resizedPath);

        generatedFiles.push(resizedName);
      }
    }

    console.log('Generated images:', generatedFiles);
    res.json({
      success: true,
      filename: originalName,
      sizes: generatedFiles,
      original: { width: metadata.width, height: metadata.height }
    });
  } catch (err) {
    console.error('Image processing error:', err);
    res.status(500).json({ error: 'Image processing failed: ' + err.message });
  }
});

// Delete an image and all its sizes
router.delete('/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!filename) return res.status(400).json({ error: 'Missing filename' });

  try {
    const parsed = parsePath(filename);
    const baseName = parsed.name;
    const ext = parsed.ext;

    const sizes = ['', '-800', '-600', '-400', '-thumb'];
    const deleted = [];
    const gitTracked = [];

    sizes.forEach(suffix => {
      const imgName = baseName + suffix + ext;
      const imgPath = join(getPublicDir(), imgName);
      const gitPath = 'public/' + imgName;

      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
        deleted.push(imgName);

        try {
          runGit('git ls-files --error-unmatch "' + gitPath + '"');
          runGit('git rm --cached "' + gitPath + '"');
          gitTracked.push(imgName);
          deletedImages.push(gitPath);
        } catch (e) {
          // File not tracked in git
        }
      }
    });

    console.log('Deleted images:', deleted);
    if (gitTracked.length > 0) {
      console.log('Staged for git deletion:', gitTracked);
    }

    res.json({ success: true, deleted, gitTracked });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
