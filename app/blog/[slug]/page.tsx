import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from "@/lib/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://dnspreviewer.com";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const f = post.frontmatter;
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: f.seoTitle ?? f.title,
    description: f.description,
    keywords: f.keywords,
    authors: [{ name: f.author }],
    alternates: { canonical: url },
    openGraph: {
      title: f.title,
      description: f.description,
      url,
      type: "article",
      publishedTime: f.publishedAt,
      modifiedTime: f.updatedAt ?? f.publishedAt,
      authors: [f.author],
      tags: f.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: f.title,
      description: f.description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * JSON-LD Article schema — eligible for Google rich results (article carousel,
 * Top Stories, author info card). The graph also includes a Person entity for
 * the author so Google can build a knowledge-panel-style attribution.
 */
function articleJsonLd(post: ReturnType<typeof getPostBySlug>) {
  if (!post) return null;
  const f = post.frontmatter;
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: f.title,
        description: f.description,
        url,
        datePublished: f.publishedAt,
        dateModified: f.updatedAt ?? f.publishedAt,
        author: { "@id": `${SITE_URL}/#author-${f.author.replace(/\s+/g, "-").toLowerCase()}` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        keywords: (f.keywords ?? []).join(", "),
        articleSection: f.category,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        wordCount: post.wordCount,
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#author-${f.author.replace(/\s+/g, "-").toLowerCase()}`,
        name: f.author,
        description: f.authorBio,
        url: SITE_URL,
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "DNS Previewer",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/apple-icon` },
      },
    ],
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const f = post.frontmatter;
  const related = getRelatedPosts(slug, 3);
  const jsonLd = articleJsonLd(post);

  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-8 sm:py-12">
        <nav className="text-xs text-ink-500 mb-6">
          <Link href="/" className="hover:text-brand-600">
            Home
          </Link>{" "}
          <span className="mx-1">·</span>{" "}
          <Link href="/blog" className="hover:text-brand-600">
            Blog
          </Link>
        </nav>

        <article>
          <header className="mb-8 sm:mb-10">
            {f.category && (
              <span className="chip">{f.category}</span>
            )}
            <h1 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900 leading-tight">
              {f.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
              <span className="font-medium text-ink-700">{f.author}</span>
              <span className="text-ink-300">·</span>
              <time dateTime={f.publishedAt}>{formatDate(f.publishedAt)}</time>
              <span className="text-ink-300">·</span>
              <span>{post.readingTimeMinutes} min read</span>
            </div>
          </header>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>

        {/* Author bio — second (and final) place where DNS Previewer is mentioned */}
        {f.authorBio && (
          <aside className="mt-12 sm:mt-16 card border-brand-100 bg-brand-50/30">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
              About the author
            </div>
            <div className="mt-2 font-display font-bold text-lg text-ink-900">{f.author}</div>
            <p className="mt-2 text-sm sm:text-base text-ink-700 leading-relaxed">
              {f.authorBio}
            </p>
          </aside>
        )}

        {related.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <h2 className="heading text-xl sm:text-2xl text-ink-900 mb-5">
              Related reading
            </h2>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="card block group hover:border-brand-200 transition"
                  >
                    <div className="font-display font-semibold text-ink-900 group-hover:text-brand-600 transition">
                      {r.frontmatter.title}
                    </div>
                    <div className="mt-2 text-sm text-ink-700">
                      {r.frontmatter.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-14 sm:mt-20 card text-center bg-gradient-to-br from-brand-500 to-brand-600 text-white">
          <h2 className="heading text-xl sm:text-2xl leading-tight">
            Try the free DNS preview tool
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/90 max-w-xl mx-auto">
            Preview your site on a new server before flipping DNS. Every feature unlocked.
            No card, no signup wall.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-cream transition"
            >
              Start a free preview
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
