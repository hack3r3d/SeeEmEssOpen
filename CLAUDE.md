# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SeeEmEss is a CMS framework for Eleventy-based sites. It provides an admin interface for managing blog content with git-based publishing, image upload with automatic resizing, and Eleventy filters.

## Commands

```bash
npm test          # No tests yet (placeholder)
npm run admin     # Start admin server (configured in consuming project)
```

### Publish NPM package.

```bash
npm version patch  # or minor major
npm publish --access public
git push && git push --tags 
```

Node 20+ required (see .nvmrc).

## Architecture

### Entry Point (index.js)
Exports: `startAdminServer(options)`, `createConfig(options)`, `filters`, and config getters.

### Admin Server (admin/)
- **server.js**: Express app with routes for posts, images, publishing, preview, synopsis
- **config.js**: Singleton configuration pattern - `createConfig()` sets config, getters retrieve it
- **routes/**: API endpoints
  - `posts.js`: CRUD for markdown posts, lede flagging, recursive directory scanning
  - `images.js`: Base64 upload, sharp-based resizing (generates 4 sizes: thumb/400/600/800px)
  - `publish.js`: Git workflow - creates branch, commits, merges to main with --no-ff, pushes
  - `preview.js`: Markdown→HTML rendering with custom template support
  - `synopsis.js`: Optional Ollama integration for AI summaries
- **utils/**:
  - `git.js`: Git command helpers
  - `markdown.js`: Custom YAML-like frontmatter parser (not full YAML)
- **templates/**: Eta templates for admin UI and preview

### Eleventy Integration (_config/filters.js)
11 filters: `readableDate`, `htmlDateString`, `head`, `min`, `getKeys`, `filterTagList`, `capitalize`, `sortAlphabetically`, `thumbSuffix`, `smartQuotes`

## Key Patterns

### Frontmatter Format
Custom parser in `admin/utils/markdown.js`. Supported fields: title, synopsis, date, tags, image, imageCaption, imageCredit, author, gallery, images, status, lede, showGallery.

### Git Publishing Workflow
Branch naming: `MMDDYYYY_word-word-timestamp` (48 pre-set words in config.js). Always merges with `--no-ff` for clear history.

### Image Processing
Uploads generate 4 size variants. Filenames sanitized to alphanumeric/hyphens/underscores. Size suffix added before extension (e.g., `photo-400.jpg`).

## Configuration

```javascript
startAdminServer({
  sections: [{id, name, folder, tag}],  // Required
  cmsRoot: string,           // Project root
  contentDir: './content/blog',
  publicDir: './public',
  imageUrlPath: '/uploads',
  previewTemplate: string,   // Custom preview template path
  port: 3000,
  imageSizes: [150, 400, 600, 800],
  branchWords: []            // Custom words for branch naming
});
```

## Important Notes

- Admin interface has no authentication (local-only by design)
- Requires git CLI in PATH
- Ollama with llama3 model optional for synopsis generation
- 50MB request limit for image upload
