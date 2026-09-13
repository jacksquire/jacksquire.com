import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('all rendered newsletter forms submit through the site API', () => {
  const homepage = readFileSync(new URL('../.vercel/output/static/index.html', import.meta.url), 'utf8');
  const blog = readFileSync(new URL('../.vercel/output/static/blog/index.html', import.meta.url), 'utf8');
  const renderedForms = `${homepage}\n${blog}`;

  assert.equal(existsSync(new URL('../src/pages/api/newsletter.ts', import.meta.url)), true);
  assert.equal((renderedForms.match(/<form[^>]*data-newsletter-form/g) || []).length, 4);
  assert.equal((renderedForms.match(/<input[^>]*name="email"/g) || []).length, 4);
  assert.match(renderedForms, /data-newsletter-status/);
});
