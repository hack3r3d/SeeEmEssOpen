import { Router } from 'express';
import fs from 'fs';
import { dirname } from 'path';
import { Eta } from 'eta';
import { md } from '../utils/markdown.js';

/**
 * Create preview router with eta templating
 * @param {Eta} eta - Eta instance
 * @param {string} imageUrlPath - URL path prefix for images
 * @param {string|null} customTemplatePath - Path to custom preview template
 * @returns {Router} Express router
 */
export default function createPreviewRouter(eta, imageUrlPath = '/uploads', customTemplatePath = null) {
  const router = Router();

  router.post('/', (req, res) => {
    const { title, synopsis, date, tags, image, imageCaption, imageCredit, author, body, showGallery } = req.body;

    // Parse gallery from JSON string if needed
    let gallery = req.body.gallery;
    if (typeof gallery === 'string') {
      try { gallery = JSON.parse(gallery); } catch (e) { gallery = []; }
    }
    if (!Array.isArray(gallery)) gallery = [];

    // Parse images (inline content images) from JSON string if needed
    let images = req.body.images;
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch (e) { images = []; }
    }
    if (!Array.isArray(images)) images = [];

    // Convert markdown to HTML
    const htmlBody = md.render(body || '');

    // Format date (handle both YYYY-MM-DD and YYYY-MM-DDTHH:MM formats)
    let dateObj;
    if (date) {
      dateObj = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00');
    } else {
      dateObj = new Date();
    }
    const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });

    // Build gallery HTML
    let galleryHtml = '';
    const showGalleryBool = showGallery === true || showGallery === 'true' || showGallery === 'on';
    if (showGalleryBool && gallery && gallery.length > 0) {
      galleryHtml = '<div class="photo-gallery"><h3 class="gallery-title">Photo Gallery</h3><div class="gallery-grid" id="galleryGrid">';
      gallery.forEach((item, idx) => {
        const img = typeof item === 'string' ? item : item.src;
        const caption = typeof item === 'object' ? item.caption : '';
        const credit = typeof item === 'object' ? item.credit : '';
        const lastDot = img.lastIndexOf('.');
        const thumbImg = lastDot > -1 ? img.slice(0, lastDot) + '-thumb' + img.slice(lastDot) : img + '-thumb';
        galleryHtml += `<figure class="gallery-item" data-index="${idx}" data-src="${imageUrlPath}/${img}" data-caption="${(caption || '').replace(/"/g, '&quot;')}" data-credit="${(credit || '').replace(/"/g, '&quot;')}" onclick="openGalleryLightbox(${idx})">`;
        galleryHtml += `<img src="${imageUrlPath}/${thumbImg}" alt="${caption || 'Gallery image'}" loading="lazy">`;
        galleryHtml += '</figure>';
      });
      galleryHtml += '</div></div>';
    }

    // Build tags HTML
    let tagsHtml = '';
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        tagsHtml = '<span class="post-tags">' + tagArray.map(t =>
          '<a href="#">' + t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() + '</a>'
        ).join(' · ') + '</span>';
      }
    }

    // Render template
    const templateData = {
      title,
      synopsis,
      image,
      imageCaption,
      imageCredit,
      author,
      body,
      htmlBody,
      date,
      formattedDate,
      tags,
      tagsHtml,
      galleryHtml,
      gallery,
      images,
      showGallery: showGalleryBool,
      imageUrlPath
    };

    let html;
    if (customTemplatePath && fs.existsSync(customTemplatePath)) {
      // Use custom template from project with fresh Eta instance
      const customEta = new Eta({ views: dirname(customTemplatePath) });
      const template = fs.readFileSync(customTemplatePath, 'utf-8');
      html = customEta.renderString(template, templateData);
    } else {
      // Use default template
      html = eta.render('preview', templateData);
    }

    res.send(html);
  });

  return router;
}
