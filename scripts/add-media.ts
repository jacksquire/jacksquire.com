import prompts from 'prompts';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as cheerio from 'cheerio';
import _ from 'lodash';

// --- Shared Utils ---
async function downloadImage(url: string, folder: string, filename: string): Promise<string> {
    const publicDir = path.join(process.cwd(), 'public', 'images', 'library', folder);
    await fs.mkdir(publicDir, { recursive: true });

    const destination = path.join(publicDir, filename);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
        await pipeline(response.body as any, createWriteStream(destination));
        return `/images/library/${folder}/${filename}`;
    } catch (e) {
        console.error(`Failed to download image ${url}:`, e);
        return '';
    }
}

function makeSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseTier(input: string): string {
    const norm = input.toUpperCase().trim();
    if (['S+', 'S', 'A', 'B', 'C', 'D'].includes(norm)) return norm;
    if (input.toLowerCase().includes('legendary') || input.toLowerCase().includes('fire')) return 'S+';
    return 'B'; // Default
}

function parseDate(input: string): string {
    const today = new Date();
    if (!input || input === 'now' || input === 'today') {
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    // Simple checks
    if (input.match(/^\d{4}$/)) return input;
    if (input.match(/^\d{4}-\d{2}$/)) return input;
    return input; // simplistic passthrough
}

// --- BOOK Logic (Ported/Simplified) ---
async function handleBook() {
    // We can reuse the existing script logic or import it, 
    // but for cleaner arch let's just re-implement specific function or exec the other script.
    // For now, let's just shell out to the existing script? NO, that's messy. 
    // I'll reimplement the core "search google books" here or import it if I exported it.
    // Since I didn't export it, I'll copy-paste the relevant parts for speed (DRY later).

    // ... Actually, to save context window, I will assume I can copy the helper functions from add-book.ts 
    // or just instruct the user "We are using the same logic". 
    // Let's implement fully correctly.

    const { query } = await prompts({ type: 'text', name: 'query', message: 'Book Title:' });
    if (!query) return;

    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
    const data: any = await res.json();
    if (!data.items?.length) return console.log('No books found.');

    const choice = await prompts({
        type: 'select',
        name: 'idx',
        message: 'Select Book',
        choices: data.items.slice(0, 5).map((item: any) => ({
            title: `${item.volumeInfo.title} by ${item.volumeInfo.authors?.join(', ')}`,
            value: item
        }))
    });

    const book = choice.idx?.volumeInfo;
    if (!book) return;

    const interview = await prompts([
        { type: 'text', name: 'dateRead', message: 'Date read (YYYY-MM):', initial: new Date().toISOString().slice(0, 7) },
        { type: 'text', name: 'tier', message: 'Tier (S+, S, A...):' },
        { type: 'text', name: 'hotTake', message: 'Hot Take:' },
        { type: 'select', name: 'readability', message: 'Readability?', choices: [{ title: 'Quick', value: 'Quick' }, { title: 'Medium', value: 'Medium' }, { title: 'Dense', value: 'Dense' }] },
        { type: 'select', name: 'isFiction', message: 'Fiction?', choices: [{ title: 'No', value: false }, { title: 'Yes', value: true }] }
    ]);

    // Cover
    let coverPath = '';
    if (book.imageLinks?.thumbnail) {
        const url = book.imageLinks.thumbnail.replace('&edge=curl', '');
        coverPath = await downloadImage(url, 'books', `${makeSlug(book.title)}.jpg`);
    }

    const frontmatter = {
        type: 'book',
        title: book.title,
        author: book.authors?.join(', ') || 'Unknown',
        slug: makeSlug(book.title),
        coverImage: coverPath,
        tier: parseTier(interview.tier),
        dateRead: parseDate(interview.dateRead),
        hotTake: interview.hotTake,
        isbn: book.industryIdentifiers?.[0]?.identifier,
        pageCount: book.pageCount,
        publishedYear: book.publishedDate ? parseInt(book.publishedDate.substring(0, 4)) : undefined,
        amazonLink: `https://amazon.com/dp/${book.industryIdentifiers?.[0]?.identifier}?tag=MYAFFILIATETAG`,
        format: ['Kindle'], // lazy default
        isFiction: interview.isFiction,
        readability: interview.readability,
        categories: book.categories || []
    };

    await saveFile('books', frontmatter.slug, frontmatter);
}


// --- PODCAST Logic ---
async function handlePodcast() {
    const { query } = await prompts({ type: 'text', name: 'query', message: 'Podcast Name:' });
    if (!query) return;

    // Search iTunes API for Podcasts
    const res = await fetch(`https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(query)}&limit=5`);
    const data: any = await res.json();

    if (!data.results?.length) return console.log('No podcasts found.');

    const podChoice = await prompts({
        type: 'select',
        name: 'idx',
        message: 'Select Podcast',
        choices: data.results.map((p: any) => ({ title: p.collectionName, value: p }))
    });
    const podcast = podChoice.idx;
    if (!podcast) return;

    // We need an EPISODE title usually? Or are we adding the whole podcast?
    // User request: "Podcast Episode"
    // "Huberman Lab - Episode #142"
    // The iTunes API returns the Feed URL. We could parse the RSS feed to find episodes? 
    // OR we just ask the user for the episode title manually to save complexity of RSS parsing.
    // Let's ask for Episode Title.

    const epDetails = await prompts([
        { type: 'text', name: 'episodeTitle', message: 'Episode Title:' },
        { type: 'text', name: 'guest', message: 'Guest (optional):' },
        { type: 'text', name: 'duration', message: 'Duration (e.g. 2h 15m):' }
    ]);

    const interview = await prompts([
        { type: 'text', name: 'dateRead', message: 'Date listened (YYYY-MM):', initial: new Date().toISOString().slice(0, 7) },
        { type: 'text', name: 'tier', message: 'Tier (S+, S, A...):' },
        { type: 'text', name: 'hotTake', message: 'Hot Take:' },
        { type: 'text', name: 'link', message: 'Link:' }
    ]);

    let coverPath = '';
    if (podcast.artworkUrl600) {
        coverPath = await downloadImage(podcast.artworkUrl600, 'podcasts', `${makeSlug(podcast.collectionName)}.jpg`);
    }

    const frontmatter = {
        type: 'podcast',
        title: epDetails.episodeTitle,
        podcastName: podcast.collectionName,
        host: podcast.artistName,
        guest: epDetails.guest,
        slug: makeSlug(`${podcast.collectionName}-${epDetails.episodeTitle}`),
        coverImage: coverPath,
        tier: parseTier(interview.tier),
        dateRead: parseDate(interview.dateRead),
        hotTake: interview.hotTake,
        categories: podcast.genres || [],
        duration: epDetails.duration,
        appleLink: interview.link
    };

    await saveFile('podcasts', frontmatter.slug, frontmatter);
}

// --- VIDEO Logic ---
async function handleVideo() {
    const { url } = await prompts({ type: 'text', name: 'url', message: 'YouTube URL:' });
    if (!url) return;

    // Use oEmbed for metadata
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    let videoData: any = {};
    try {
        const res = await fetch(oembedUrl);
        if (res.ok) videoData = await res.json();
    } catch (e) { console.error("Could not fetch oEmbed", e); }

    if (!videoData.title) {
        console.log("Could not resolve video metadata.");
        // Fallback to manual? for now return
        return;
    }

    const interview = await prompts([
        { type: 'text', name: 'dateRead', message: 'Date watched (YYYY-MM):', initial: new Date().toISOString().slice(0, 7) },
        { type: 'text', name: 'tier', message: 'Tier (S+, S, A...):' },
        { type: 'text', name: 'hotTake', message: 'Hot Take:' },
        { type: 'text', name: 'duration', message: 'Duration (mins):', initial: '10' }
    ]);

    let coverPath = '';
    if (videoData.thumbnail_url) {
        coverPath = await downloadImage(videoData.thumbnail_url, 'videos', `${makeSlug(videoData.title)}.jpg`);
    }

    // Extract Video ID
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();

    const frontmatter = {
        type: 'video',
        title: videoData.title,
        channel: videoData.author_name,
        platform: 'YouTube',
        slug: makeSlug(videoData.title),
        coverImage: coverPath,
        tier: parseTier(interview.tier),
        dateRead: parseDate(interview.dateRead),
        hotTake: interview.hotTake,
        videoId: videoId,
        duration: interview.duration, // "10"
        categories: []
    };

    await saveFile('videos', frontmatter.slug, frontmatter);
}

// --- ARTICLE Logic ---
async function handleArticle() {
    const { url } = await prompts({ type: 'text', name: 'url', message: 'Article URL:' });
    if (!url) return;

    // Cheerio Scraping
    let meta: any = { title: '', image: '', author: '', site_name: '' };
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);

        meta.title = $('meta[property="og:title"]').attr('content') || $('title').text();
        meta.image = $('meta[property="og:image"]').attr('content');
        meta.site_name = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;
        meta.author = $('meta[name="author"]').attr('content') || meta.site_name;
    } catch (e) { console.error("Scrape failed", e); }

    console.log(`Found: ${meta.title}`);

    const interview = await prompts([
        { type: 'text', name: 'dateRead', message: 'Date read (YYYY-MM):', initial: new Date().toISOString().slice(0, 7) },
        { type: 'text', name: 'tier', message: 'Tier (S+, S, A...):' },
        { type: 'text', name: 'hotTake', message: 'Hot Take:' },
        { type: 'number', name: 'wordCount', message: 'Word count (~):', initial: 1000 }
    ]);

    let coverPath = '';
    if (meta.image) {
        // If relative URL, prepend domain?
        let imgUrl = meta.image;
        if (imgUrl.startsWith('/')) imgUrl = new URL(imgUrl, url).toString();

        coverPath = await downloadImage(imgUrl, 'articles', `${makeSlug(meta.title)}.jpg`);
    }

    const frontmatter = {
        type: 'article',
        title: meta.title,
        author: meta.author, // mapped to creator in UI logic?
        publication: meta.site_name,
        slug: makeSlug(meta.title),
        coverImage: coverPath,
        tier: parseTier(interview.tier),
        dateRead: parseDate(interview.dateRead),
        hotTake: interview.hotTake,
        link: url,
        wordCount: interview.wordCount,
        publishedDate: new Date().getFullYear().toString() // default
    };

    await saveFile('articles', frontmatter.slug, frontmatter);
}

async function saveFile(subdir: string, slug: string, data: any) {
    const content = `---
${Object.entries(data).map(([k, v]) => {
        if (v === undefined) return '';
        if (Array.isArray(v)) return `${k}: [${v.map(i => `"${i}"`).join(', ')}]`;
        if (typeof v === 'string') return `${k}: "${v.replace(/"/g, '\\"')}"`;
        return `${k}: ${v}`;
    }).filter(Boolean).join('\n')}
---

${data.hotTake}
`;

    const outDir = path.join(process.cwd(), 'src', 'content', 'library', subdir);
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${slug}.md`);
    await fs.writeFile(outPath, content);
    console.log(`\n✨ Saved to src/content/library/${subdir}/${slug}.md`);
}


// --- Main ---
async function main() {
    const { type } = await prompts({
        type: 'select',
        name: 'type',
        message: 'What are we adding?',
        choices: [
            { title: 'Book', value: 'book' },
            { title: 'Podcast', value: 'podcast' },
            { title: 'Video', value: 'video' },
            { title: 'Article', value: 'article' }
        ]
    });

    if (type === 'book') await handleBook();
    if (type === 'podcast') await handlePodcast();
    if (type === 'video') await handleVideo();
    if (type === 'article') await handleArticle();
}

main().catch(console.error);
