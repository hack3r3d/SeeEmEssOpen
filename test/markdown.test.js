import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseFrontmatter, parseFrontmatterAndBody, buildMarkdown } from '../admin/utils/markdown.js';

describe('parseFrontmatter', () => {
  it('parses basic key-value pairs', () => {
    const content = `---
title: Hello World
date: 2024-01-15
status: draft
---`;
    const result = parseFrontmatter(content);
    assert.strictEqual(result.title, 'Hello World');
    assert.strictEqual(result.date, '2024-01-15');
    assert.strictEqual(result.status, 'draft');
  });

  it('parses quoted strings with escaped quotes', () => {
    const content = `---
title: "Hello \\"World\\""
synopsis: "A story about \\"testing\\""
---`;
    const result = parseFrontmatter(content);
    assert.strictEqual(result.title, 'Hello "World"');
    assert.strictEqual(result.synopsis, 'A story about "testing"');
  });

  it('parses inline arrays', () => {
    const content = `---
tags: [tag1, tag2, tag3]
---`;
    const result = parseFrontmatter(content);
    assert.deepStrictEqual(result.tags, ['tag1', 'tag2', 'tag3']);
  });

  it('parses inline arrays with quoted values', () => {
    const content = `---
tags: ["tag1", "tag2"]
---`;
    const result = parseFrontmatter(content);
    assert.deepStrictEqual(result.tags, ['tag1', 'tag2']);
  });

  it('parses booleans', () => {
    const content = `---
lede: true
showGallery: false
---`;
    const result = parseFrontmatter(content);
    assert.strictEqual(result.lede, true);
    assert.strictEqual(result.showGallery, false);
  });

  it('parses multi-line arrays (gallery with objects)', () => {
    const content = `---
gallery:
  - src: "image1.jpg"
    caption: "First image"
  - src: "image2.jpg"
    caption: "Second image"
    credit: "Photographer"
---`;
    const result = parseFrontmatter(content);
    assert.strictEqual(result.gallery.length, 2);
    assert.strictEqual(result.gallery[0].src, 'image1.jpg');
    assert.strictEqual(result.gallery[0].caption, 'First image');
    assert.strictEqual(result.gallery[1].src, 'image2.jpg');
    assert.strictEqual(result.gallery[1].caption, 'Second image');
    assert.strictEqual(result.gallery[1].credit, 'Photographer');
  });

  it('returns empty object for missing frontmatter', () => {
    const content = 'Just some body content without frontmatter';
    const result = parseFrontmatter(content);
    assert.deepStrictEqual(result, {});
  });

  it('returns empty object for empty content', () => {
    const result = parseFrontmatter('');
    assert.deepStrictEqual(result, {});
  });
});

describe('parseFrontmatterAndBody', () => {
  it('separates frontmatter from body', () => {
    const content = `---
title: Test Post
date: 2024-01-15
---

This is the body content.

With multiple paragraphs.`;
    const result = parseFrontmatterAndBody(content);
    assert.strictEqual(result.frontmatter.title, 'Test Post');
    assert.strictEqual(result.frontmatter.date, '2024-01-15');
    assert.strictEqual(result.body, 'This is the body content.\n\nWith multiple paragraphs.');
  });

  it('handles content with no frontmatter', () => {
    const content = 'Just body content, no frontmatter here.';
    const result = parseFrontmatterAndBody(content);
    assert.deepStrictEqual(result.frontmatter, {});
    assert.strictEqual(result.body, content);
  });

  it('handles empty body after frontmatter', () => {
    const content = `---
title: Empty Body Post
---`;
    const result = parseFrontmatterAndBody(content);
    assert.strictEqual(result.frontmatter.title, 'Empty Body Post');
    assert.strictEqual(result.body, '');
  });
});

describe('buildMarkdown', () => {
  it('reconstructs markdown with all basic fields', () => {
    const fm = {
      title: 'Test Post',
      synopsis: 'A test synopsis',
      date: '2024-01-15',
      tags: ['tag1', 'tag2']
    };
    const body = 'Body content here.';
    const result = buildMarkdown(fm, body);

    assert.ok(result.includes('title: "Test Post"'));
    assert.ok(result.includes('synopsis: "A test synopsis"'));
    assert.ok(result.includes('date: 2024-01-15'));
    assert.ok(result.includes('tags: ["tag1", "tag2"]'));
    assert.ok(result.includes('Body content here.'));
  });

  it('handles tags as comma-separated string', () => {
    const fm = {
      title: 'Test',
      synopsis: '',
      date: '2024-01-15',
      tags: 'tag1, tag2, tag3'
    };
    const result = buildMarkdown(fm, '');
    assert.ok(result.includes('tags: ["tag1", "tag2", "tag3"]'));
  });

  it('escapes quotes in title and synopsis', () => {
    const fm = {
      title: 'A "Quoted" Title',
      synopsis: 'Synopsis with "quotes"',
      date: '2024-01-15',
      tags: []
    };
    const result = buildMarkdown(fm, '');
    assert.ok(result.includes('title: "A \\"Quoted\\" Title"'));
    assert.ok(result.includes('synopsis: "Synopsis with \\"quotes\\""'));
  });

  it('includes optional fields when present', () => {
    const fm = {
      title: 'Test',
      synopsis: '',
      date: '2024-01-15',
      tags: [],
      image: '/uploads/photo.jpg',
      imageCaption: 'A nice photo',
      imageCredit: 'Photographer Name',
      author: 'John Doe',
      lede: true,
      showGallery: true,
      status: 'draft'
    };
    const result = buildMarkdown(fm, '');
    assert.ok(result.includes('image: /uploads/photo.jpg'));
    assert.ok(result.includes('imageCaption: "A nice photo"'));
    assert.ok(result.includes('imageCredit: "Photographer Name"'));
    assert.ok(result.includes('author: "John Doe"'));
    assert.ok(result.includes('lede: true'));
    assert.ok(result.includes('showGallery: true'));
    assert.ok(result.includes('status: draft'));
  });

  it('formats gallery array correctly', () => {
    const fm = {
      title: 'Test',
      synopsis: '',
      date: '2024-01-15',
      tags: [],
      gallery: [
        { src: 'image1.jpg', caption: 'First', credit: 'Credit 1' },
        { src: 'image2.jpg', caption: 'Second' }
      ]
    };
    const result = buildMarkdown(fm, '');
    assert.ok(result.includes('gallery:'));
    assert.ok(result.includes('- src: "image1.jpg"'));
    assert.ok(result.includes('caption: "First"'));
    assert.ok(result.includes('credit: "Credit 1"'));
    assert.ok(result.includes('- src: "image2.jpg"'));
    assert.ok(result.includes('caption: "Second"'));
  });

  it('formats images array correctly', () => {
    const fm = {
      title: 'Test',
      synopsis: '',
      date: '2024-01-15',
      tags: [],
      images: [
        { src: 'img1.jpg', caption: 'Caption 1' },
        { src: 'img2.jpg' }
      ]
    };
    const result = buildMarkdown(fm, '');
    assert.ok(result.includes('images:'));
    assert.ok(result.includes('- src: "img1.jpg"'));
    assert.ok(result.includes('caption: "Caption 1"'));
    assert.ok(result.includes('- src: "img2.jpg"'));
  });

  it('handles gallery with string items', () => {
    const fm = {
      title: 'Test',
      synopsis: '',
      date: '2024-01-15',
      tags: [],
      gallery: ['image1.jpg', 'image2.jpg']
    };
    const result = buildMarkdown(fm, '');
    assert.ok(result.includes('gallery:'));
    assert.ok(result.includes('- src: "image1.jpg"'));
    assert.ok(result.includes('- src: "image2.jpg"'));
  });

  it('handles missing/empty optional arrays', () => {
    const fm = {
      title: 'Test',
      synopsis: '',
      date: '2024-01-15',
      tags: []
    };
    const result = buildMarkdown(fm, 'Body');
    assert.ok(!result.includes('gallery:'));
    assert.ok(!result.includes('images:'));
  });
});
