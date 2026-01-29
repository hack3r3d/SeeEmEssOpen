import { Router } from 'express';
import fs from 'fs';
import { join } from 'path';
import { getContentDir, getSections } from '../config.js';
import { parseFrontmatter, parseFrontmatterAndBody, buildMarkdown } from '../utils/markdown.js';

const router = Router();

// Determine section from path and tags
function getSection(basePath, tags) {
  const sections = getSections();
  for (const section of sections) {
    if (basePath.startsWith(section.folder)) {
      return section.id;
    }
    if (Array.isArray(tags) && tags.includes(section.tag)) {
      return section.id;
    }
  }
  // Default to first section or 'default'
  return sections.length > 0 ? sections[0].id : 'default';
}

// List all posts
router.get('/', (req, res) => {
  const posts = [];
  function scanDir(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath, join(basePath, item));
      } else if (item.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const frontmatter = parseFrontmatter(content);
        const section = getSection(basePath, frontmatter.tags);
        posts.push({ path: join(basePath, item), fullPath, section, ...frontmatter });
      }
    }
  }
  scanDir(getContentDir());
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(posts);
});

// Set post as lead story for its section
router.post('/set-lede/*', (req, res) => {
  const postPath = req.params[0];
  const fullPath = join(getContentDir(), postPath);

  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Post not found' });

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatterAndBody(content);
    const section = getSection(postPath, frontmatter.tags);

    // Clear lede from all posts in the same section
    function clearLedeInSection(dir, basePath = '') {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemFullPath = join(dir, item);
        const stat = fs.statSync(itemFullPath);
        if (stat.isDirectory()) {
          clearLedeInSection(itemFullPath, join(basePath, item));
        } else if (item.endsWith('.md')) {
          const itemContent = fs.readFileSync(itemFullPath, 'utf-8');
          const itemFm = parseFrontmatter(itemContent);
          const itemSection = getSection(basePath, itemFm.tags);

          if (itemSection === section && itemFm.lede) {
            const { frontmatter: fm, body: bd } = parseFrontmatterAndBody(itemContent);
            delete fm.lede;
            const updatedContent = buildMarkdown({
              title: fm.title,
              synopsis: fm.synopsis,
              date: fm.date,
              tags: Array.isArray(fm.tags) ? fm.tags.join(', ') : fm.tags,
              image: fm.image,
              imageCaption: fm.imageCaption,
              imageCredit: fm.imageCredit,
              imageFocalX: fm.imageFocalX,
              imageFocalY: fm.imageFocalY,
              author: fm.author,
              gallery: fm.gallery,
              showGallery: fm.showGallery,
              status: fm.status,
              lede: false
            }, bd);
            fs.writeFileSync(itemFullPath, updatedContent);
          }
        }
      }
    }

    clearLedeInSection(getContentDir());

    // Set lede on the target post
    const updatedContent = buildMarkdown({
      title: frontmatter.title,
      synopsis: frontmatter.synopsis,
      date: frontmatter.date,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : frontmatter.tags,
      image: frontmatter.image,
      imageCaption: frontmatter.imageCaption,
      imageCredit: frontmatter.imageCredit,
      imageFocalX: frontmatter.imageFocalX,
      imageFocalY: frontmatter.imageFocalY,
      author: frontmatter.author,
      gallery: frontmatter.gallery,
      showGallery: frontmatter.showGallery,
      status: frontmatter.status,
      lede: true
    }, body);
    fs.writeFileSync(fullPath, updatedContent);

    res.json({ success: true, section });
  } catch (err) {
    console.error('Set lede error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single post
router.get('/*', (req, res) => {
  const postPath = req.params[0];
  const fullPath = join(getContentDir(), postPath);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Post not found' });
  const content = fs.readFileSync(fullPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatterAndBody(content);
  res.json({ ...frontmatter, body, path: postPath });
});

// Create new post
router.post('/', (req, res) => {
  const { title, synopsis, tags, image, imageCaption, imageCredit, imageFocalX, imageFocalY, body, folder, status, author, gallery, images, showGallery, lede, date: clientDate, customFields } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const date = (clientDate || new Date().toISOString()).slice(0, 10);
  const folderPath = folder || slug;
  const dirPath = join(getContentDir(), folderPath);
  const filePath = join(dirPath, slug + '.md');

  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const fileContent = buildMarkdown({ title, synopsis, date, tags, image, imageCaption, imageCredit, imageFocalX, imageFocalY, author, gallery, images, showGallery, lede, status: status || 'draft', customFields }, body);
  fs.writeFileSync(filePath, fileContent);
  res.json({ success: true, path: join(folderPath, slug + '.md') });
});

// Update post
router.put('/*', (req, res) => {
  const postPath = req.params[0];
  const fullPath = join(getContentDir(), postPath);
  const { title, synopsis, tags, image, imageCaption, imageCredit, imageFocalX, imageFocalY, body, date: clientDate, status, author, gallery, images, showGallery, lede, customFields } = req.body;
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Post not found' });

  const date = clientDate ? clientDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const fileContent = buildMarkdown({ title, synopsis, date, tags, image, imageCaption, imageCredit, imageFocalX, imageFocalY, author, gallery, images, showGallery, lede, status: status || 'draft', customFields }, body);
  fs.writeFileSync(fullPath, fileContent);
  res.json({ success: true });
});

// Delete post
router.delete('/*', (req, res) => {
  const postPath = req.params[0];
  const fullPath = join(getContentDir(), postPath);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Post not found' });
  fs.unlinkSync(fullPath);
  res.json({ success: true });
});

export default router;
