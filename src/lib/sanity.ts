import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'n7i175k4',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// GROQ Queries
export const queries = {
  // Get all published posts
  allPosts: `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    "categories": categories[]->{ _id, title, "slug": slug.current },
    "readingTime": round(length(pt::text(body)) / 5 / 200) + " min read"
  }`,

  // Get single post by slug
  postBySlug: `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    body,
    "categories": categories[]->{ _id, title, "slug": slug.current },
    "author": author->{ _id, name, image, bio },
    "readingTime": round(length(pt::text(body)) / 5 / 200) + " min read"
  }`,

  // Get featured posts (limit 3)
  featuredPosts: `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...3] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    "categories": categories[]->{ _id, title },
    "readingTime": round(length(pt::text(body)) / 5 / 200) + " min read"
  }`,

  // Get all categories
  allCategories: `*[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description
  }`,

  // Get posts by category
  postsByCategory: `*[_type == "post" && $categoryId in categories[]._ref && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    "categories": categories[]->{ _id, title },
    "readingTime": round(length(pt::text(body)) / 5 / 200) + " min read"
  }`,

  // Get all projects
  allProjects: `*[_type == "project"] | order(year desc, featured desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    image,
    techStack,
    liveUrl,
    status,
    featured,
    year
  }`,

  // Get featured projects
  featuredProjects: `*[_type == "project" && featured == true] | order(year desc)[0...3] {
    _id,
    title,
    "slug": slug.current,
    description,
    image,
    techStack,
    liveUrl,
    status,
    year
  }`,

  // Get author info
  author: `*[_type == "author"][0] {
    _id,
    name,
    image,
    bio
  }`,
};

// Helper function to fetch data
export async function sanityFetch<T>(query: string, params = {}): Promise<T> {
  return await client.fetch(query, params);
}
