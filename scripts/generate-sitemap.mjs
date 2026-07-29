import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://tkd197557-arch.github.io/foot-vox/";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const articlesPath = path.join(projectDirectory, "data", "articles.json");
const sitemapPath = path.join(projectDirectory, "sitemap.xml");
const checkOnly = process.argv.includes("--check");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const payload = JSON.parse(fs.readFileSync(articlesPath, "utf8"));
if (!Array.isArray(payload.articles)) {
  throw new Error("data/articles.json must contain an articles array.");
}

const articleIds = new Set();
const indexableArticles = payload.articles.filter((article) => {
  if (!article?.articleId || articleIds.has(article.articleId)) {
    throw new Error(`Invalid or duplicate articleId: ${article?.articleId || "(missing)"}`);
  }
  articleIds.add(article.articleId);
  if (!datePattern.test(article.updatedDate || "")) {
    throw new Error(`Invalid updatedDate: ${article.articleId}`);
  }
  return article.indexable !== false;
});

if (indexableArticles.length === 0) {
  throw new Error("At least one indexable article is required.");
}

const latestUpdatedDate = indexableArticles.reduce(
  (latest, article) => article.updatedDate > latest ? article.updatedDate : latest,
  ""
);
const urls = [
  { loc: SITE_URL, lastmod: latestUpdatedDate },
  ...indexableArticles.map((article) => ({
    loc: new URL(
      `article.html?id=${encodeURIComponent(article.articleId)}`,
      SITE_URL
    ).href,
    lastmod: article.updatedDate
  }))
];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.flatMap(({ loc, lastmod }) => [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "  </url>"
  ]),
  "</urlset>",
  ""
].join("\n");

const urlCount = (sitemap.match(/<url>/g) || []).length;
const locCount = (sitemap.match(/<loc>[^<]+<\/loc>/g) || []).length;
const lastmodCount = (sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length;
if (
  !sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset ')
  || !sitemap.endsWith("</urlset>\n")
  || urlCount !== urls.length
  || locCount !== urls.length
  || lastmodCount !== urls.length
) {
  throw new Error("Generated sitemap failed XML structure validation.");
}

if (checkOnly) {
  const existing = fs.readFileSync(sitemapPath, "utf8").replaceAll("\r\n", "\n");
  if (existing !== sitemap) {
    throw new Error("sitemap.xml is out of date. Run: node scripts/generate-sitemap.mjs");
  }
  console.log(`sitemap.xml is valid and current (${urls.length} URLs).`);
} else {
  fs.writeFileSync(sitemapPath, sitemap, "utf8");
  console.log(`Generated sitemap.xml (${urls.length} URLs).`);
}
