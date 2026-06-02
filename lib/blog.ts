import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Markdown-driven blog. Posts live as .md files in /content/blog/<slug>.md
 * with YAML frontmatter. We parse them at build time (server-side only) and
 * render to HTML. No CMS, no runtime DB read — just files in the repo.
 */

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostFAQ {
  q: string;
  a: string;
}

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  publishedAt: string; // ISO date (YYYY-MM-DD)
  updatedAt?: string;
  author: string;
  authorBio?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  /** SEO title override — if absent we fall back to `title`. */
  seoTitle?: string;
  /** Optional path override; defaults to filename without .md */
  slug?: string;
  /**
   * Optional FAQ items appended to the post.
   *
   * Rendered as a collapsible <details> section at the bottom and emitted
   * as FAQPage JSON-LD so Google can show them as a rich-result accordion
   * in search. 3-6 items is the sweet spot. Each question is a chance to
   * rank for a long-tail query and capture "People Also Ask" placements.
   */
  faqs?: BlogPostFAQ[];
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  /** The markdown body, unrendered. */
  content: string;
  /** Pre-rendered HTML, with our content classes applied via globals.css. */
  html: string;
  /** Estimated reading time in minutes (200 wpm baseline). */
  readingTimeMinutes: number;
  /** Raw word count of the body. */
  wordCount: number;
}

export interface BlogPostMeta {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  readingTimeMinutes: number;
  wordCount: number;
}

// Configure marked once: GitHub-flavored markdown, lazy newlines as <br>.
marked.use({
  gfm: true,
  breaks: false,
});

/**
 * Compute reading time using ~200 words/min (industry standard for adult readers).
 * Code blocks read slower in reality but counting them at 1x is a fine approximation.
 */
function readingTime(text: string): { minutes: number; words: number } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return {
    minutes: Math.max(1, Math.ceil(words / 200)),
    words,
  };
}

function postFilePath(slug: string): string {
  return path.join(POSTS_DIR, `${slug}.md`);
}

function listSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** Read a single post end-to-end. Returns null if the slug doesn't exist. */
export function getPostBySlug(slug: string): BlogPost | null {
  const file = postFilePath(slug);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const frontmatter = parsed.data as BlogPostFrontmatter;
  const rt = readingTime(parsed.content);
  // marked.parse returns a string synchronously when no async extensions used.
  const html = marked.parse(parsed.content) as string;

  return {
    slug: frontmatter.slug ?? slug,
    frontmatter,
    content: parsed.content,
    html,
    readingTimeMinutes: rt.minutes,
    wordCount: rt.words,
  };
}

/** Lightweight metadata for index/sitemap listings — skips HTML rendering. */
export function getPostMetaBySlug(slug: string): BlogPostMeta | null {
  const file = postFilePath(slug);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const rt = readingTime(parsed.content);
  return {
    slug: (parsed.data as BlogPostFrontmatter).slug ?? slug,
    frontmatter: parsed.data as BlogPostFrontmatter,
    readingTimeMinutes: rt.minutes,
    wordCount: rt.words,
  };
}

/**
 * All posts, sorted newest first. Used by /blog index + sitemap.
 * Drafts (frontmatter.publishedAt empty or in the future) are filtered out.
 */
export function getAllPostMeta(): BlogPostMeta[] {
  const now = Date.now();
  return listSlugs()
    .map((s) => getPostMetaBySlug(s))
    .filter((p): p is BlogPostMeta => p !== null)
    .filter((p) => {
      if (!p.frontmatter.publishedAt) return false;
      return new Date(p.frontmatter.publishedAt).getTime() <= now;
    })
    .sort(
      (a, b) =>
        new Date(b.frontmatter.publishedAt).getTime() -
        new Date(a.frontmatter.publishedAt).getTime(),
    );
}

/** Slugs only — used by generateStaticParams in dynamic route. */
export function getAllPostSlugs(): string[] {
  return getAllPostMeta().map((p) => p.slug);
}

/** Posts that share at least one tag with the given post (excluding itself). */
export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const target = getPostMetaBySlug(slug);
  if (!target) return [];
  const targetTags = new Set(target.frontmatter.tags ?? []);
  if (targetTags.size === 0) {
    // Fallback: latest other posts
    return getAllPostMeta()
      .filter((p) => p.slug !== slug)
      .slice(0, limit);
  }
  return getAllPostMeta()
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const overlap = (p.frontmatter.tags ?? []).filter((t) => targetTags.has(t)).length;
      return { post: p, overlap };
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((x) => x.post);
}
