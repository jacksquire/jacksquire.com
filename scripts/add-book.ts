import prompts from 'prompts';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// --- Types ---
interface BookMetadata {
    title: string;
    authors: string[];
    description?: string;
    pageCount?: number;
    publishedDate?: string; // YYYY or YYYY-MM-DD
    categories?: string[];
    imageLinks?: { thumbnail?: string; medium?: string; large?: string; extraLarge?: string };
    isbn?: string;
}

// --- API Helpers ---
async function searchGoogleBooks(query: string): Promise<BookMetadata[]> {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const data: any = await res.json();

    if (!data.items) return [];

    return data.items.map((item: any) => {
        const info = item.volumeInfo;
        const identifier = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier
            || info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier;

        return {
            title: info.title,
            authors: info.authors || [],
            description: info.description,
            pageCount: info.pageCount,
            publishedDate: info.publishedDate,
            categories: info.categories || [],
            imageLinks: info.imageLinks,
            isbn: identifier,
        };
    });
}

// --- Utils ---
async function downloadCover(url: string, filename: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const publicDir = path.join(process.cwd(), 'public', 'images', 'library');
    await fs.mkdir(publicDir, { recursive: true });

    const destination = path.join(publicDir, filename);
    await pipeline(response.body as any, createWriteStream(destination));

    return `/images/library/${filename}`;
}

function parseDateRead(input: string): string {
    // Simple heuristics for now. Can be expanded locally.
    const lower = input.toLowerCase().trim();
    if (lower.match(/^\d{4}$/)) return lower; // "2024"
    // "March 2024", "mar 2024", "03/2024" -> "2024-03"
    // This is a naive implementation; a real NLP library or robust regex suite would be better.
    const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const parts = lower.split(/[\s/-]+/);
    if (parts.length === 2) {
        const [p1, p2] = parts;
        const year = p1.match(/^\d{4}$/) ? p1 : p2.match(/^\d{4}$/) ? p2 : null;
        let month = null;

        // Check for numeric month
        if (p1.match(/^\d{1,2}$/) && p1 !== year) month = p1.padStart(2, '0');
        else if (p2.match(/^\d{1,2}$/) && p2 !== year) month = p2.padStart(2, '0');

        // Check for text month
        else {
            for (const [m, num] of Object.entries(monthMap)) {
                if (p1.startsWith(m) || p2.startsWith(m)) {
                    month = num;
                    break;
                }
            }
        }

        if (year && month) return `${year}-${month}`;
    }

    // Fallback to raw if logic fails (user can edit md later)
    return input;
}

function parseArray(input: string): string[] {
    if (!input || input.toLowerCase() === 'none') return [];
    // Split by commas, "and", "&"
    return input.split(/,| and | & /).map(s => s.trim()).filter(Boolean);
}

function parseTier(input: string): string {
    const norm = input.toUpperCase().trim();
    if (['S+', 'S', 'A', 'B', 'C', 'D'].includes(norm)) return norm;
    // Handle descriptive text maybe? "Legendary" -> S+
    if (input.toLowerCase().includes('legendary') || input.toLowerCase().includes('fire')) return 'S+';
    return 'B'; // Default safety? Or ask again? For now default B.
}

// --- Main Flow ---
async function main() {
    const args = process.argv.slice(2);
    let initialQuery = args.join(' ');

    if (!initialQuery) {
        const res = await prompts({
            type: 'text',
            name: 'query',
            message: 'What book do you want to add?',
        });
        initialQuery = res.query;
    }

    if (!initialQuery) return;

    console.log(`\n🔍 Searching Google Books for "${initialQuery}"...`);
    const books = await searchGoogleBooks(initialQuery);

    if (books.length === 0) {
        console.log('No books found.');
        return;
    }

    const selection = await prompts({
        type: 'select',
        name: 'book',
        message: 'Which book is it?',
        choices: books.map((b, i) => ({
            title: `${b.title} by ${b.authors.join(', ')} (${b.publishedDate?.substring(0, 4) || 'N/A'})`,
            value: i,
        })),
    });

    if (selection.book === undefined) {
        console.log('Cancelled.');
        return;
    }

    const book = books[selection.book];
    console.log(`\n✅ Selected: ${book.title}`);

    // Download Cover
    let coverPath = '';
    if (book.imageLinks?.thumbnail) {
        // Try to get a higher res version if possible by modifying URL params 
        // (Google books often hides high res behind zoom=1, but sometimes zoom=0 is all provided)
        const coverUrl = book.imageLinks.thumbnail.replace('&edge=curl', '');
        const slug = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${slug}.jpg`;

        process.stdout.write('Downloading cover... ');
        try {
            coverPath = await downloadCover(coverUrl, filename);
            console.log('Done.');
        } catch (e) {
            console.log('Failed (using placeholder).');
        }
    }

    console.log('\n🎙️  Interview Time\n');

    const answers = await prompts([
        {
            type: 'text',
            name: 'dateRead',
            message: 'When did you read this? (year or month+year)',
            initial: new Date().getFullYear().toString(),
        },
        {
            type: 'text',
            name: 'format',
            message: 'How did you consume it? (Physical, Kindle, Audiobook...)',
            initial: 'Kindle',
        },
        {
            type: 'text',
            name: 'tier',
            message: 'Tier rating? (S+, S, A, B, C, D)',
        },
        {
            type: 'select',
            name: 'isFiction',
            message: 'Fiction or Non-fiction?',
            choices: [{ title: 'Non-fiction', value: false }, { title: 'Fiction', value: true }],
        },
        {
            type: 'select',
            name: 'readability',
            message: 'How readable was it?',
            choices: [
                { title: 'Quick / Light', value: 'Quick' },
                { title: 'Medium', value: 'Medium' },
                { title: 'Dense / Heavy', value: 'Dense' },
            ],
        },
        {
            type: 'text',
            name: 'hotTake',
            message: 'Hot take? (1-2 sentences)',
        },
        {
            type: 'list', // prompts 'list' splits by integer comma by default, strictness varies
            name: 'keyTakeaways',
            message: 'Key takeaways? (comma separated, or enter to skip)',
            separator: ',',
        },
        {
            type: 'text',
            name: 'recommendTo',
            message: 'Who should read this? (comma separated)',
        },
        {
            type: 'select',
            name: 'status',
            message: 'Reread status?',
            choices: [
                { title: 'One and done', value: 'One and done' },
                { title: 'Might reread', value: 'Might reread' },
                { title: 'Definitely will reread', value: 'Definitely will reread' },
                { title: 'Already reread', value: 'Already reread' },
            ],
        }
    ]);

    // Post-processing
    const frontmatter = {
        title: book.title,
        author: book.authors.join(', '),
        slug: book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        isbn: book.isbn || '',
        coverImage: coverPath,
        pageCount: book.pageCount,
        publishedYear: book.publishedDate ? parseInt(book.publishedDate.substring(0, 4)) : undefined,
        amazonLink: `https://amazon.com/dp/${book.isbn || ''}?tag=MYAFFILIATETAG`, // simple fallback
        goodreadsRating: 0, // Placeholder, API requires key or scraping
        description: book.description || '',

        dateRead: parseDateRead(answers.dateRead),
        format: parseArray(answers.format),
        tier: parseTier(answers.tier),
        isFiction: answers.isFiction,
        readability: answers.readability,

        hotTake: answers.hotTake,
        keyTakeaways: answers.keyTakeaways || [],
        longerThoughts: '', // Left empty for user to fill in file

        recommendTo: parseArray(answers.recommendTo),
        status: answers.status,
        rereadCount: answers.status === 'Already reread' ? 1 : 0,
        rereadDates: [],
        categories: book.categories || [],
    };

    // Generate File
    const fileContent = `---
${Object.entries(frontmatter).map(([k, v]) => {
        if (v === undefined) return '';
        if (Array.isArray(v)) return `${k}: [${v.map(i => `"${i}"`).join(', ')}]`;
        if (typeof v === 'string') return `${k}: "${v.replace(/"/g, '\\"')}"`;
        return `${k}: ${v}`;
    }).filter(Boolean).join('\n')}
---

${frontmatter.hotTake}
`;

    const outDir = path.join(process.cwd(), 'src', 'content', 'library');
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${frontmatter.slug}.md`);

    await fs.writeFile(outPath, fileContent);
    console.log(`\n✨ Saved to src/content/library/${frontmatter.slug}.md`);
}

main().catch(console.error);
