import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const index = posts
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .map((p) => ({
      t: p.data.title,
      d: p.data.description ?? '',
      tags: p.data.tags ?? [],
      url: `/posts/${p.id}`,
      pubDate: p.data.pubDate.toISOString(),
      cover: p.data.cover ?? '',
    }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
