/**
 * Tells IndexNow search engines (Bing, and through it ChatGPT search and
 * Copilot, plus Yandex, Seznam and others) that the site's pages changed, so
 * they recrawl now instead of on their own schedule.
 *
 * Run after a deploy that adds or edits pages:
 *   npm run indexnow            -> submits every URL in the live sitemap
 *   npm run indexnow -- /blog/x -> submits only the paths given
 *
 * The key is public by design: IndexNow proves ownership by fetching
 * https://dnspreviewer.com/<key>.txt, which lives in public/.
 */
const HOST = "dnspreviewer.com";
const KEY = "4cccb7a1e2d628332e4684ef4755825e";

async function sitemapUrls(): Promise<string[]> {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const paths = process.argv.slice(2);
  const urlList = paths.length
    ? paths.map((p) => new URL(p, `https://${HOST}`).toString())
    : await sitemapUrls();

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList,
    }),
  });
  // 200 = accepted, 202 = accepted but key not yet verified.
  console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URL(s)`);
  if (res.status >= 400) {
    console.error(await res.text());
    process.exit(1);
  }
}

main();
