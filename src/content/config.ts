import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    image: z.string().optional(),
    category: z.string().default('General'),
    draft: z.boolean().default(false),
  }),
});

const library = defineCollection({
  type: 'content',
  schema: z.discriminatedUnion('type', [
    // Book Schema
    z.object({
      type: z.literal('book'),
      title: z.string(),
      author: z.string(), // standardized field for display, mapped from specific if needed
      slug: z.string().optional(),
      coverImage: z.string(),
      tier: z.enum(['S+', 'S', 'A', 'B', 'C', 'D']),
      dateRead: z.string(),
      hotTake: z.string(),
      keyTakeaways: z.array(z.string()).optional(),
      longerThoughts: z.string().optional(),
      recommendTo: z.array(z.string()).optional(),
      categories: z.array(z.string()).default([]),

      // Book Specific
      isbn: z.string().optional(),
      pageCount: z.number().optional(),
      publishedYear: z.number().or(z.string()).optional(),
      amazonLink: z.string().optional(),
      goodreadsRating: z.number().optional(),
      description: z.string().optional(),
      format: z.array(z.string()),
      isFiction: z.boolean(),
      readability: z.enum(['Quick', 'Medium', 'Dense']),
      status: z.enum(['One and done', 'Might reread', 'Definitely will reread', 'Will Reread', 'Already reread']).optional(),
      rereadCount: z.number().default(0),
      rereadDates: z.array(z.string()).default([]),
    }),

    // Podcast Schema
    z.object({
      type: z.literal('podcast'),
      title: z.string(), // Episode Title
      podcastName: z.string(),
      host: z.string(),
      guest: z.string().optional(),
      slug: z.string().optional(),
      coverImage: z.string(),
      tier: z.enum(['S+', 'S', 'A', 'B', 'C', 'D']),
      dateRead: z.string(), // dateConsumed
      hotTake: z.string(),
      keyTakeaways: z.array(z.string()).optional(),
      longerThoughts: z.string().optional(),
      recommendTo: z.array(z.string()).optional(),
      categories: z.array(z.string()).default([]),

      // Podcast Specific
      episodeNumber: z.number().or(z.string()).optional(),
      duration: z.string().optional(), // "2h 34m"
      spotifyLink: z.string().optional(),
      appleLink: z.string().optional(),
      youtubeLink: z.string().optional(),
      timestamps: z.array(z.string()).optional(),
    }),

    // Video Schema
    z.object({
      type: z.literal('video'),
      title: z.string(),
      channel: z.string(),
      platform: z.literal('YouTube').default('YouTube'),
      slug: z.string().optional(),
      coverImage: z.string(),
      tier: z.enum(['S+', 'S', 'A', 'B', 'C', 'D']),
      dateRead: z.string(), // dateConsumed
      hotTake: z.string(),
      keyTakeaways: z.array(z.string()).optional(),
      longerThoughts: z.string().optional(),
      recommendTo: z.array(z.string()).optional(),
      categories: z.array(z.string()).default([]),

      // Video Specific
      videoId: z.string(),
      duration: z.string().optional(),
      timestamps: z.array(z.string()).optional(),
    }),

    // Article Schema
    z.object({
      type: z.literal('article'),
      title: z.string(),
      author: z.string(),
      publication: z.string(),
      slug: z.string().optional(),
      coverImage: z.string().optional(), // favicon or og:image
      tier: z.enum(['S+', 'S', 'A', 'B', 'C', 'D']),
      dateRead: z.string(),
      hotTake: z.string(),
      keyTakeaways: z.array(z.string()).optional(),
      longerThoughts: z.string().optional(),
      recommendTo: z.array(z.string()).optional(),
      categories: z.array(z.string()).default([]),

      // Article Specific
      link: z.string(),
      wordCount: z.number().or(z.string()).optional(),
      publishedDate: z.string().optional(),
    })
  ]),
});

export const collections = { blog, library };
