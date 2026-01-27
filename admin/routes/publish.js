import { Router } from 'express';
import fs from 'fs';
import { join } from 'path';
import { getCmsRoot, getContentDir } from '../config.js';
import { runGit, randomWord } from '../utils/git.js';
import { parseFrontmatterAndBody, buildMarkdown } from '../utils/markdown.js';
import { deletedImages, clearDeletedImages } from './images.js';

const router = Router();

// Publish a single post
router.post('/*', (req, res) => {
  const postPath = req.params[0];
  const fullPath = join(getContentDir(), postPath);

  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Post not found' });

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatterAndBody(content);

    // Update status to published
    const updatedContent = buildMarkdown({
      title: frontmatter.title,
      synopsis: frontmatter.synopsis,
      date: frontmatter.date,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : frontmatter.tags,
      image: frontmatter.image,
      imageCaption: frontmatter.imageCaption,
      imageCredit: frontmatter.imageCredit,
      author: frontmatter.author,
      gallery: frontmatter.gallery,
      showGallery: frontmatter.showGallery,
      lede: frontmatter.lede,
      status: 'published'
    }, body);
    fs.writeFileSync(fullPath, updatedContent);

    // Create branch name
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();
    const branchName = mm + dd + yyyy + '_' + randomWord();

    const currentBranch = runGit('git branch --show-current').trim();

    runGit('git checkout -b ' + branchName);

    // Stage the markdown file
    const relativePostPath = 'content/blog/' + postPath;
    runGit('git add "' + relativePostPath + '"');

    // Stage the lead image and all its sizes
    if (frontmatter.image) {
      stageImageWithSizes(frontmatter.image);
    }

    // Stage gallery images and all their sizes
    if (frontmatter.gallery && Array.isArray(frontmatter.gallery)) {
      frontmatter.gallery.forEach(item => {
        const imgName = typeof item === 'string' ? item : item.src;
        if (imgName) stageImageWithSizes(imgName);
      });
    }

    // Check if there are changes to commit
    const status = runGit('git status --porcelain');
    if (!status.trim()) {
      // No changes - clean up and return
      runGit('git checkout main');
      runGit('git branch -d ' + branchName);
      return res.json({ success: true, message: 'Already published - no changes needed' });
    }

    // Commit
    const commitMsg = 'Publish: ' + (frontmatter.title || postPath);
    runGit('git commit -m "' + commitMsg.replace(/"/g, '\\"') + '"');

    // Switch back to main and merge
    runGit('git checkout main');
    runGit('git merge --no-ff ' + branchName + ' -m "Merge branch ' + branchName + '"');
    runGit('git push origin main');
    runGit('git branch -d ' + branchName);

    res.json({ success: true, branch: branchName, message: 'Published and pushed to main' });
  } catch (err) {
    console.error('Publish error:', err);
    try { runGit('git checkout main'); } catch (e) {}
    res.status(500).json({ error: err.message });
  }
});

function stageImageWithSizes(imageName) {
  const lastDot = imageName.lastIndexOf('.');
  const baseName = lastDot > -1 ? imageName.slice(0, lastDot) : imageName;
  const ext = lastDot > -1 ? imageName.slice(lastDot) : '';

  const sizes = ['', '-800', '-600', '-400', '-thumb'];
  sizes.forEach(suffix => {
    const imgFile = 'public/' + baseName + suffix + ext;
    if (fs.existsSync(join(getCmsRoot(), imgFile))) {
      runGit('git add "' + imgFile + '"');
    }
  });
}

export default router;

// Publish all pending changes route (for main server to use)
export function publishChangesHandler(req, res) {
  try {
    const status = runGit('git status --porcelain');
    if (!status.trim() && deletedImages.length === 0) {
      return res.json({ success: true, message: 'No changes to publish.' });
    }

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const branchName = mm + dd + yyyy + '_' + hh + min + '_' + randomWord();

    const currentBranch = runGit('git branch --show-current').trim();
    runGit('git checkout -b ' + branchName);

    // Add all changes in content/blog
    runGit('git add content/blog/');

    // Stage any deleted images
    deletedImages.forEach(imgPath => {
      try {
        runGit('git add "' + imgPath + '"');
      } catch (e) {}
    });

    const commitMsg = 'Admin changes: ' + new Date().toISOString();
    runGit('git commit -m "' + commitMsg.replace(/"/g, '\\"') + '"');

    runGit('git checkout main');
    runGit('git merge --no-ff ' + branchName + ' -m "Merge branch ' + branchName + '"');
    runGit('git push origin main');
    runGit('git branch -d ' + branchName);

    clearDeletedImages();

    res.json({ success: true, branch: branchName, message: 'Pushed to main.' });
  } catch (err) {
    console.error('Publish changes error:', err);
    try { runGit('git checkout main'); } catch (e) {}
    res.status(500).json({ error: err.message });
  }
}
