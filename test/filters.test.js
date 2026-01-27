import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import filtersPlugin from '../_config/filters.js';

// Mock eleventyConfig and capture registered filters
function createMockConfig() {
  const filters = {};
  return {
    addFilter: (name, fn) => { filters[name] = fn; },
    filters
  };
}

describe('Eleventy Filters', () => {
  let filters;

  beforeEach(() => {
    const mockConfig = createMockConfig();
    filtersPlugin(mockConfig);
    filters = mockConfig.filters;
  });

  describe('head', () => {
    it('returns first n elements with positive n', () => {
      const result = filters.head([1, 2, 3, 4, 5], 3);
      assert.deepStrictEqual(result, [1, 2, 3]);
    });

    it('returns last n elements with negative n', () => {
      const result = filters.head([1, 2, 3, 4, 5], -2);
      assert.deepStrictEqual(result, [4, 5]);
    });

    it('returns empty array for empty input', () => {
      const result = filters.head([], 3);
      assert.deepStrictEqual(result, []);
    });

    it('returns empty array for non-array input', () => {
      const result = filters.head(null, 3);
      assert.deepStrictEqual(result, []);
    });

    it('returns all elements when n exceeds array length', () => {
      const result = filters.head([1, 2], 5);
      assert.deepStrictEqual(result, [1, 2]);
    });
  });

  describe('filterTagList', () => {
    it('removes "all" and "posts" tags', () => {
      const result = filters.filterTagList(['all', 'posts', 'javascript', 'nodejs']);
      assert.deepStrictEqual(result, ['javascript', 'nodejs']);
    });

    it('deduplicates tags', () => {
      const result = filters.filterTagList(['tag1', 'tag1', 'tag2', 'tag2']);
      assert.deepStrictEqual(result, ['tag1', 'tag2']);
    });

    it('handles empty/null input', () => {
      assert.deepStrictEqual(filters.filterTagList([]), []);
      assert.deepStrictEqual(filters.filterTagList(null), []);
      assert.deepStrictEqual(filters.filterTagList(undefined), []);
    });

    it('removes "all" and "posts" while deduplicating', () => {
      const result = filters.filterTagList(['all', 'tag1', 'posts', 'tag1', 'tag2']);
      assert.deepStrictEqual(result, ['tag1', 'tag2']);
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter of each word', () => {
      const result = filters.capitalize('hello world');
      assert.strictEqual(result, 'Hello World');
    });

    it('lowercases rest of word', () => {
      const result = filters.capitalize('HELLO WORLD');
      assert.strictEqual(result, 'Hello World');
    });

    it('handles empty string', () => {
      assert.strictEqual(filters.capitalize(''), '');
    });

    it('returns falsy values unchanged', () => {
      assert.strictEqual(filters.capitalize(null), null);
      assert.strictEqual(filters.capitalize(undefined), undefined);
    });

    it('handles single word', () => {
      assert.strictEqual(filters.capitalize('hello'), 'Hello');
    });
  });

  describe('sortAlphabetically', () => {
    it('sorts strings alphabetically', () => {
      const result = filters.sortAlphabetically(['banana', 'apple', 'cherry']);
      assert.deepStrictEqual(result, ['apple', 'banana', 'cherry']);
    });

    it('handles empty array', () => {
      assert.deepStrictEqual(filters.sortAlphabetically([]), []);
    });

    it('handles null/undefined input', () => {
      assert.deepStrictEqual(filters.sortAlphabetically(null), []);
      assert.deepStrictEqual(filters.sortAlphabetically(undefined), []);
    });

    it('handles single element', () => {
      assert.deepStrictEqual(filters.sortAlphabetically(['only']), ['only']);
    });
  });

  describe('thumbSuffix', () => {
    it('adds suffix before file extension', () => {
      const result = filters.thumbSuffix('photo.jpg', '-400');
      assert.strictEqual(result, 'photo-400.jpg');
    });

    it('uses default suffix of -400', () => {
      const result = filters.thumbSuffix('image.png');
      assert.strictEqual(result, 'image-400.png');
    });

    it('handles filename without extension', () => {
      const result = filters.thumbSuffix('noextension', '-thumb');
      assert.strictEqual(result, 'noextension-thumb');
    });

    it('returns falsy values unchanged', () => {
      assert.strictEqual(filters.thumbSuffix(null), null);
      assert.strictEqual(filters.thumbSuffix(undefined), undefined);
      assert.strictEqual(filters.thumbSuffix(''), '');
    });

    it('handles multiple dots in filename', () => {
      const result = filters.thumbSuffix('my.photo.name.jpg', '-600');
      assert.strictEqual(result, 'my.photo.name-600.jpg');
    });
  });

  describe('smartQuotes', () => {
    it('converts straight double quotes to curly quotes', () => {
      const result = filters.smartQuotes('He said "hello" to me.');
      assert.ok(result.includes('\u201C')); // Opening quote
      assert.ok(result.includes('\u201D')); // Closing quote
      assert.ok(!result.includes('"'));
    });

    it('converts straight single quotes to curly quotes', () => {
      const result = filters.smartQuotes("It's a 'test' case.");
      assert.ok(result.includes('\u2019')); // Apostrophe/closing single
      assert.ok(result.includes('\u2018')); // Opening single
      assert.ok(!result.includes("'"));
    });

    it('returns falsy values unchanged', () => {
      assert.strictEqual(filters.smartQuotes(null), null);
      assert.strictEqual(filters.smartQuotes(undefined), undefined);
      assert.strictEqual(filters.smartQuotes(''), '');
    });

    it('handles text without quotes', () => {
      const result = filters.smartQuotes('No quotes here');
      assert.strictEqual(result, 'No quotes here');
    });
  });

  describe('min', () => {
    it('returns the smallest number', () => {
      const result = filters.min(5, 2, 8, 1, 9);
      assert.strictEqual(result, 1);
    });

    it('handles single number', () => {
      const result = filters.min(42);
      assert.strictEqual(result, 42);
    });

    it('handles negative numbers', () => {
      const result = filters.min(-5, 0, 5);
      assert.strictEqual(result, -5);
    });
  });

  describe('getKeys', () => {
    it('returns object keys', () => {
      const result = filters.getKeys({ a: 1, b: 2, c: 3 });
      assert.deepStrictEqual(result, ['a', 'b', 'c']);
    });

    it('returns empty array for empty object', () => {
      const result = filters.getKeys({});
      assert.deepStrictEqual(result, []);
    });
  });
});
