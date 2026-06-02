import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getAllPostMeta } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — DNS migration, WordPress, and the parts of web hosting nobody writes about",
  description:
    "Field notes on DNS migrations, WordPress hosting, and the operational details that break websites at 3am. Written by Romail Shah, founder of DNS Previewer.",
  alternates: { canonical: "https://dnspreviewer.com/blog" },
  openGraph: {
    title: "DNS Previewer Blog",
    description:
      "Field notes on DNS migrations, WordPress, and the operational details that break websites at 3am.",
    url: "https://dnspreviewer.com/blog",
    type: "website",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPostMeta();

  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-10 sm:py-16">
        <header className="text-center mb-12 sm:mb-16">
          <span className="chip">Field notes</span>
          <h1 className="heading mt-5 text-3xl sm:text-4xl md:text-5xl text-ink-900 leading-tight">
            The DNS Previewer blog
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-700 max-w-2xl mx-auto leading-relaxed">
            Field notes on DNS migrations, WordPress hosting, and the parts of running
            websites that break at 3am — written from the trenches by people who&apos;ve
            been on those calls.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-ink-500">
              The first post is on its way. Check back in a few days.
            </p>
          </div>
        ) : (
          <ul className="space-y-4 sm:space-y-5">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="card block group hover:border-brand-200 hover:-translate-y-px transition"
                >
                  {post.frontmatter.category && (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                      {post.frontmatter.category}
                    </span>
                  )}
                  <h2 className="mt-2 font-display font-bold text-xl sm:text-2xl text-ink-900 group-hover:text-brand-600 transition leading-tight">
                    {post.frontmatter.title}
                  </h2>
                  <p className="mt-3 text-ink-700 text-sm sm:text-base leading-relaxed">
                    {post.frontmatter.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    <span>{post.frontmatter.author}</span>
                    <span className="text-ink-300">·</span>
                    <time dateTime={post.frontmatter.publishedAt}>
                      {formatDate(post.frontmatter.publishedAt)}
                    </time>
                    <span className="text-ink-300">·</span>
                    <span>{post.readingTimeMinutes} min read</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Soft footer CTA — every blog index visitor should see the product */}
        <section className="mt-16 sm:mt-20 card text-center bg-gradient-to-br from-brand-50 to-cream border-brand-100">
          <h3 className="font-display font-bold text-xl sm:text-2xl text-ink-900">
            The free DNS preview tool behind this blog
          </h3>
          <p className="mt-3 text-sm sm:text-base text-ink-700 max-w-xl mx-auto">
            Preview your site on a new server before flipping DNS. Password protection,
            no-expiry links, wildcard subdomains — every feature unlocked. Free, forever.
          </p>
          <div className="mt-6">
            <Link href="/" className="btn-primary">
              Try DNS Previewer
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
