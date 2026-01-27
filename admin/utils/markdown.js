import markdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';

// Configure markdown-it with attrs support
export const md = markdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
}).use(markdownItAttrs);

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !line.startsWith('  ') && !line.startsWith('\t')) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();

      // Check if this is a multi-line YAML array (gallery with objects)
      if (value === '' && i + 1 < lines.length && lines[i + 1].trim().startsWith('- ')) {
        const items = [];
        i++;
        let currentItem = null;
        while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t') || lines[i].trim().startsWith('- '))) {
          const itemLine = lines[i].trim();
          if (itemLine.startsWith('- ')) {
            if (currentItem) items.push(currentItem);
            currentItem = {};
            const firstProp = itemLine.slice(2).trim();
            if (firstProp) {
              const propColon = firstProp.indexOf(':');
              if (propColon > 0) {
                const propKey = firstProp.slice(0, propColon).trim();
                let propVal = firstProp.slice(propColon + 1).trim();
                if (propVal.startsWith('"') && propVal.endsWith('"')) {
                  propVal = propVal.slice(1, -1).replace(/\\"/g, '"');
                }
                currentItem[propKey] = propVal;
              }
            }
          } else if (currentItem) {
            const propColon = itemLine.indexOf(':');
            if (propColon > 0) {
              const propKey = itemLine.slice(0, propColon).trim();
              let propVal = itemLine.slice(propColon + 1).trim();
              if (propVal.startsWith('"') && propVal.endsWith('"')) {
                propVal = propVal.slice(1, -1).replace(/\\"/g, '"');
              }
              currentItem[propKey] = propVal;
            }
          }
          i++;
        }
        if (currentItem) items.push(currentItem);
        fm[key] = items;
        continue;
      }

      // Handle quoted strings
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/\\"/g, '"');
      }
      // Handle inline arrays
      else if (value.startsWith('[')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      }
      // Handle booleans
      else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }
      fm[key] = value;
    }
    i++;
  }
  return fm;
}

export function parseFrontmatterAndBody(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n*([\s\S]*)/);
  if (!match) return { frontmatter: {}, body: content };
  return { frontmatter: parseFrontmatter(content), body: match[2].trim() };
}

export function buildMarkdown(fm, body) {
  const tagArray = typeof fm.tags === 'string'
    ? fm.tags.split(',').map(t => t.trim()).filter(Boolean)
    : (fm.tags || []);

  const galleryArray = Array.isArray(fm.gallery) ? fm.gallery : [];
  const imagesArray = Array.isArray(fm.images) ? fm.images : [];

  const lines = [
    '---',
    'title: "' + (fm.title || '').replace(/"/g, '\\"') + '"',
    'synopsis: "' + (fm.synopsis || '').replace(/"/g, '\\"') + '"',
    'date: ' + fm.date,
    'tags: [' + tagArray.map(t => '"' + t + '"').join(', ') + ']',
  ];
  if (fm.image) lines.push('image: ' + fm.image);
  if (fm.imageCaption) lines.push('imageCaption: "' + fm.imageCaption.replace(/"/g, '\\"') + '"');
  if (fm.imageCredit) lines.push('imageCredit: "' + fm.imageCredit.replace(/"/g, '\\"') + '"');
  if (fm.author) lines.push('author: "' + fm.author.replace(/"/g, '\\"') + '"');
  if (imagesArray.length > 0) {
    const imagesYaml = imagesArray.map(item => {
      let yaml = '  - src: "' + (item.src || '') + '"';
      if (item.caption) yaml += '\n    caption: "' + item.caption.replace(/"/g, '\\"') + '"';
      if (item.credit) yaml += '\n    credit: "' + item.credit.replace(/"/g, '\\"') + '"';
      return yaml;
    }).join('\n');
    lines.push('images:\n' + imagesYaml);
  }
  if (galleryArray.length > 0) {
    const galleryYaml = galleryArray.map(item => {
      if (typeof item === 'string') {
        return '  - src: "' + item + '"';
      }
      let yaml = '  - src: "' + (item.src || '') + '"';
      if (item.caption) yaml += '\n    caption: "' + item.caption.replace(/"/g, '\\"') + '"';
      if (item.credit) yaml += '\n    credit: "' + item.credit.replace(/"/g, '\\"') + '"';
      return yaml;
    }).join('\n');
    lines.push('gallery:\n' + galleryYaml);
  }
  if (fm.showGallery) lines.push('showGallery: true');
  if (fm.lede === true) lines.push('lede: true');
  if (fm.status) lines.push('status: ' + fm.status);
  lines.push('---');
  return lines.join('\n') + '\n\n' + body;
}
