import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "FAQ — DNS Previewer" };

const faqs: Array<{ q: string; a: string }> = [
  {
    q: "Is this really free?",
    a: "Yes. Every feature is free, forever. No signup, no watermark, no 'pro' tier behind the most useful features.",
  },
  {
    q: "How long do previews last?",
    a: "15 minutes from creation. If you need more time, create a fresh preview — it takes a few seconds.",
  },
  {
    q: "Do you log my browsing?",
    a: "We count request hits per session for your own dashboard (so you can confirm your preview is being used). We don't log URLs, request bodies, or your IP beyond what's needed for rate limiting.",
  },
  {
    q: "Why is there a banner in the bottom-left of my preview?",
    a: "So you always know you're looking at a DNS Previewer session and not your live site. It's dismissible with the × button, doesn't affect layout, and never appears on your actual domain.",
  },
  {
    q: "Can I hide the banner?",
    a: "You can dismiss it per-page. For a permanently clean preview, self-host DNS Previewer — it's open source.",
  },
  {
    q: "Why do some links inside the preview go to my real domain?",
    a: "We rewrite HTML and CSS URLs pointing at your exact domain. Subdomains (like cdn.example.com) and absolute JavaScript-built URLs aren't automatically rewritten — same behavior as every other preview proxy.",
  },
  {
    q: "Will logins / checkouts work?",
    a: "Often yes, sometimes no. Cookies, OAuth redirects, and CSRF checks can be tied to the exact apex domain. Use the preview for visual + functional spot checks; don't expect full transactional flow unless your app is domain-agnostic.",
  },
  {
    q: "I'm seeing 502 / upstream error.",
    a: "Your server didn't respond in time, isn't listening on the selected scheme, or is refusing non-matching SSL. Try the other scheme (HTTP vs HTTPS) or verify your server responds on the target IP.",
  },
  {
    q: "Why a 10-per-hour limit?",
    a: "To deter abuse — someone could try to use this as an anonymizing proxy. 10 per hour is plenty for real migration work.",
  },
  {
    q: "Someone is abusing a preview. How do I report it?",
    a: "Visit /abuse or email abuse@dnspreviewer.com with the preview subdomain. We kill sessions fast.",
  },
];

export default function FAQPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-8 sm:py-14">
        <span className="chip">Help</span>
        <h1 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900">
          Frequently asked questions
        </h1>
        <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="card group">
              <summary className="font-display font-semibold text-ink-900 cursor-pointer flex items-start justify-between gap-3 list-none">
                <span className="flex-1">{f.q}</span>
                <span className="text-ink-400 group-open:rotate-45 transition-transform text-xl leading-none shrink-0">+</span>
              </summary>
              <p className="mt-3 text-sm sm:text-base text-ink-700 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
