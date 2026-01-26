# SeeEmEss

A simple CMS framework built on [Eleventy](https://www.11ty.dev/) with an admin interface for managing blog content.

## Features

- Admin interface for creating and editing posts
- Image upload with automatic resizing
- Git-based publishing workflow
- Configurable content sections
- Eleventy filters for dates and content formatting

## Caveats

This is an opinionated project. It relies on GitHub. The admin interface has no authentication mechanism, so it can only run locally. Changes are published via GitHub actions.

## Installation

```bash
npm install seeemess
```

## Usage

### 1. Set up Eleventy filters

In your `eleventy.config.js`:

```javascript
import filters from 'seeemess/filters';

export default function(eleventyConfig) {
  // Add SeeEmEss filters
  filters(eleventyConfig);

  // Your other config...
}
```

### 2. Create admin entry point

Create `admin/start.js` in your project:

```javascript
import { startAdminServer } from 'seeemess';

startAdminServer({
  sections: [
    { id: 'posts', name: 'Blog Posts', folder: 'posts', tag: 'post' },
    { id: 'news', name: 'News', folder: 'news', tag: 'news' }
  ]
});
```

### 3. Add npm script

In your `package.json`:

```json
{
  "scripts": {
    "admin": "node admin/start.js"
  }
}
```

### 4. Run the admin

```bash
npm run admin
```

The admin interface will be available at `http://localhost:3000`.

## Configuration Options

```javascript
startAdminServer({
  // Required: Define your content sections
  sections: [
    { id: 'posts', name: 'Blog Posts', folder: 'posts', tag: 'post' }
  ],

  // Optional: Override defaults
  cmsRoot: process.cwd(),           // Project root directory
  contentDir: './content/blog',     // Where posts are stored
  publicDir: './public',            // Where images are uploaded
  port: 3000                        // Admin server port
});
```

## Available Filters

When you import `seeemess/filters`, the following Eleventy filters are added:

- `readableDate` - Format dates for display
- `htmlDateString` - Format dates for HTML datetime attributes
- `head` - Get first N items from array
- `min` - Get minimum value
- `getKeys` - Get object keys
- `filterTagList` - Filter out system tags
- `capitalize` - Title case text
- `sortAlphabetically` - Sort strings alphabetically
- `thumbSuffix` - Add size suffix to image filenames
- `smartQuotes` - Convert straight quotes to typographic quotes

## Project Structure

Your project should have this structure:

```
your-site/
├── admin/
│   └── start.js          # Admin entry point
├── content/
│   └── blog/             # Your posts (organized by section folders)
├── public/               # Uploaded images
├── _includes/            # Your Eleventy layouts
├── eleventy.config.js
└── package.json
```

## License

MIT
