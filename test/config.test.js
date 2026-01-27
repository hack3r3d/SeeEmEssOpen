import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// We need to reset the module state between tests, so we use dynamic imports
async function freshImport() {
  // Clear the module from cache to reset singleton state
  const modulePath = new URL('../admin/config.js', import.meta.url).href;

  // Create a unique import each time by adding a cache-busting query
  const uniqueUrl = `${modulePath}?t=${Date.now()}-${Math.random()}`;
  return import(uniqueUrl);
}

describe('createConfig', () => {
  it('returns config with defaults', async () => {
    const { createConfig } = await freshImport();
    const config = createConfig();

    assert.ok(config.CMS_ROOT);
    assert.ok(config.CONTENT_DIR);
    assert.ok(config.PUBLIC_DIR);
    assert.strictEqual(config.IMAGE_URL_PATH, '/uploads');
    assert.strictEqual(config.PORT, 3000);
    assert.deepStrictEqual(config.SECTIONS, []);
    assert.ok(Array.isArray(config.IMAGE_SIZES));
    assert.ok(Array.isArray(config.BRANCH_WORDS));
  });

  it('merges provided options', async () => {
    const { createConfig } = await freshImport();
    const sections = [{ id: 'blog', name: 'Blog', folder: 'blog', tag: 'blog' }];
    const config = createConfig({
      cmsRoot: '/custom/root',
      port: 4000,
      sections
    });

    assert.strictEqual(config.CMS_ROOT, '/custom/root');
    assert.strictEqual(config.PORT, 4000);
    assert.deepStrictEqual(config.SECTIONS, sections);
  });

  it('normalizes imageUrlPath - adds leading slash', async () => {
    const { createConfig } = await freshImport();
    const config = createConfig({ imageUrlPath: 'images' });
    assert.strictEqual(config.IMAGE_URL_PATH, '/images');
  });

  it('normalizes imageUrlPath - removes trailing slash', async () => {
    const { createConfig } = await freshImport();
    const config = createConfig({ imageUrlPath: '/uploads/' });
    assert.strictEqual(config.IMAGE_URL_PATH, '/uploads');
  });

  it('normalizes imageUrlPath - handles both issues', async () => {
    const { createConfig } = await freshImport();
    const config = createConfig({ imageUrlPath: 'assets/images/' });
    assert.strictEqual(config.IMAGE_URL_PATH, '/assets/images');
  });

  it('accepts custom image sizes', async () => {
    const { createConfig } = await freshImport();
    const customSizes = [{ suffix: '-sm', width: 200 }];
    const config = createConfig({ imageSizes: customSizes });
    assert.deepStrictEqual(config.IMAGE_SIZES, customSizes);
  });

  it('accepts custom branch words', async () => {
    const { createConfig } = await freshImport();
    const customWords = ['foo', 'bar', 'baz'];
    const config = createConfig({ branchWords: customWords });
    assert.deepStrictEqual(config.BRANCH_WORDS, customWords);
  });

  it('resolves previewTemplate relative to cmsRoot', async () => {
    const { createConfig } = await freshImport();
    const config = createConfig({
      cmsRoot: '/project',
      previewTemplate: 'templates/preview.eta'
    });
    assert.strictEqual(config.PREVIEW_TEMPLATE, '/project/templates/preview.eta');
  });
});

describe('getConfig', () => {
  it('throws if not initialized', async () => {
    const { getConfig } = await freshImport();
    assert.throws(
      () => getConfig(),
      { message: 'Config not initialized. Call createConfig() first.' }
    );
  });

  it('returns config after createConfig called', async () => {
    const { createConfig, getConfig } = await freshImport();
    const created = createConfig({ port: 5000 });
    const retrieved = getConfig();

    assert.strictEqual(retrieved, created);
    assert.strictEqual(retrieved.PORT, 5000);
  });
});

describe('individual getters', () => {
  it('getCmsRoot returns CMS_ROOT', async () => {
    const { createConfig, getCmsRoot } = await freshImport();
    createConfig({ cmsRoot: '/test/root' });
    assert.strictEqual(getCmsRoot(), '/test/root');
  });

  it('getContentDir returns CONTENT_DIR', async () => {
    const { createConfig, getContentDir } = await freshImport();
    createConfig({ contentDir: '/custom/content' });
    assert.strictEqual(getContentDir(), '/custom/content');
  });

  it('getPublicDir returns PUBLIC_DIR', async () => {
    const { createConfig, getPublicDir } = await freshImport();
    createConfig({ publicDir: '/custom/public' });
    assert.strictEqual(getPublicDir(), '/custom/public');
  });

  it('getImageUrlPath returns IMAGE_URL_PATH', async () => {
    const { createConfig, getImageUrlPath } = await freshImport();
    createConfig({ imageUrlPath: '/media' });
    assert.strictEqual(getImageUrlPath(), '/media');
  });

  it('getPort returns PORT', async () => {
    const { createConfig, getPort } = await freshImport();
    createConfig({ port: 8080 });
    assert.strictEqual(getPort(), 8080);
  });

  it('getSections returns SECTIONS', async () => {
    const { createConfig, getSections } = await freshImport();
    const sections = [{ id: 'test' }];
    createConfig({ sections });
    assert.deepStrictEqual(getSections(), sections);
  });

  it('getImageSizes returns IMAGE_SIZES', async () => {
    const { createConfig, getImageSizes } = await freshImport();
    createConfig();
    const sizes = getImageSizes();
    assert.ok(Array.isArray(sizes));
    assert.ok(sizes.length > 0);
  });

  it('getBranchWords returns BRANCH_WORDS', async () => {
    const { createConfig, getBranchWords } = await freshImport();
    createConfig();
    const words = getBranchWords();
    assert.ok(Array.isArray(words));
    assert.ok(words.length > 0);
  });
});
