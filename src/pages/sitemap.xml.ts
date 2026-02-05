import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const site = 'https://jacksquire.com';

const staticPages = ['', 'about', 'projects', 'travels', 'blog', 'library'];

export const GET: APIRoute = async () => {
  const [blogPosts, libraryItems] = await Promise.all([
    getCollection('blog', ({ data }) => !data.draft),
    getCollection('library'),
  ]);

  const urls = [
    ...staticPages.map((page) => `${site}/${page ? page + '/' : ''}`),
    ...blogPosts.map((post) => `${site}/blog/${post.slug}/`),
    ...libraryItems.map((item) => `${site}/library/${item.slug}/`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
