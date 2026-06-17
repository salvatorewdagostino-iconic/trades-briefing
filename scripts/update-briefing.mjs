import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FEEDS = [
  { name: "Deadline",           url: "https://deadline.com/feed/" },
  { name: "Deadline",           url: "https://deadline.com/v/film/feed/" },
  { name: "Deadline",           url: "https://deadline.com/v/tv/feed/" },
  { name: "Deadline",           url: "https://deadline.com/category/casting/feed/" },
  { name: "Variety",            url: "https://variety.com/feed/" },
  { name: "Variety",            url: "https://variety.com/v/film/feed/" },
  { name: "Variety",            url: "https://variety.com/v/tv/feed/" },
  { name: "Hollywood Reporter", url: "https://www.hollywoodreporter.com/feed/" },
  { name: "Hollywood Reporter", url: "https://www.hollywoodreporter.com/c/movies/feed/" },
  { name: "Hollywood Reporter", url: "https://www.hollywoodreporter.com/c/tv/feed/" },
  { name: "IndieWire",          url: "https://www.indiewire.com/feed/" },
  { name: "IndieWire",          url: "https://www.indiewire.com/c/news/feed/" },
  { name: "IndieWire",          url: "https://www.indiewire.com/c/film/feed/" },
  { name: "IndieWire",          url: "https://www.indiewire.com/c/tv/feed/" },
  { name: "TheWrap",            url: "https://www.thewrap.com/feed/" },
  { name: "TheWrap",            url: "https://www.thewrap.com/industry-news/casting/feed/" },
  { name: "TheWrap",            url: "https://www.thewrap.com/creative-content/movies/feed/" },
  { name: "TheWrap",            url: "https://www.thewrap.com/creative-content/tv-shows/feed/" },
];

function parseRSS(xml, tradeName, today) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks) {
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ??
                   block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() ?? "";
    const link  = (block.match(/<link>([\s\S]*?)<\/link>/) ??
                   block.match(/<guid isPermaLink="true">([\s\S]*?)<\/guid>/))?.[1]?.trim() ?? "";
    const pub   = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const desc  = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ??
                   block.match(/<description>([\s\S]*?)<\/description>/))?.[1]
                   ?.replace(/<[^>]+>/g, "")
                   ?.trim()
                   ?.slice(0, 300) ?? "";
    if (!pub) continue;
    const articleDate = new Date(pub).toISOString().split("T")[0];
    if (articleDate !== today) continue;
    items.push({ trade: tradeName, title, link, description: desc });
  }
  return items;
}

async function fetchFeed(feed, today) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "trades-briefing-bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const xml = await res.text();
    return parseRSS(xml, feed.name, today);
  } catch (e) {
    console.warn(`Failed to fetch ${feed.url}:`, e.message);
    return [];
  }
}

async function main() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  console.log(`Fetching trades for ${today}...`);
  const raw_items = (await Promise.all(FEEDS.map(f => fetchFeed(f, today)))).flat();

  // Deduplicate by URL
  const seen = new Set();
  const allItems = raw_items.filter(item => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
  console.log(`Found ${allItems.length} articles from today across all trades.`);

  if (allItems.length === 0) {
    console.log("No articles found for today — skipping update.");
    process.exit(0);
  }

  const articleList = allItems
    .map((a, i) => `[${i + 1}] ${a.trade} | ${a.title}\nURL: ${a.link}`)
    .join("\n");

  const prompt = `You are a Hollywood trades analyst. Below are today's articles (${today}) from the top entertainment trades.

Identify ONLY stories where a specific film or TV project is announced, updated, or moves forward. Qualifying stories include:
- New projects greenlit or announced
- Development deals attached to a specific project
- Casting announcements for a specific project
- Studio/streamer acquisition of a specific project
- Series orders, renewals, or cancellations
- Production start or key crew attachments on a specific project

EXCLUDE everything else: reviews, box office, trailers, streaming guides, premiere calendars, opinion pieces, festival coverage, awards, network/studio restructuring, executive appointments, labor news, political news, interviews.

For each qualifying story, determine if it's a FILM or TV announcement.

Return ONLY valid JSON in this exact schema (no markdown, no explanation):
{
  "date": "${dateLabel}",
  "summary": "X film announcements, Y TV announcements across 5 trades.",
  "film": [
    {
      "title": "Project Title",
      "studio": "Studio or Distributor",
      "talent": "Key names and roles (or empty string if unknown)",
      "announcement": "One to two sentence description of what was announced.",
      "sources": [{ "name": "Trade Name", "url": "https://direct-article-url" }]
    }
  ],
  "tv": [
    {
      "title": "Project Title",
      "network": "Network or Streamer",
      "talent": "Key names and roles (or empty string if unknown)",
      "announcement": "One to two sentence description of what was announced.",
      "sources": [{ "name": "Trade Name", "url": "https://direct-article-url" }]
    }
  ]
}

If the same story appears from multiple trades, merge into one entry with multiple sources.
Max 30 items per section. Pick the most significant stories if there are more.

TODAY'S ARTICLES:
${articleList}`;

  console.log("Calling Claude API...");
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("No JSON found in response:", raw.slice(0, 500));
    process.exit(1);
  }

  const briefing = { ...JSON.parse(jsonMatch[0]), lastUpdated: new Date().toISOString() };
  console.log(`Parsed: ${briefing.film.length} film, ${briefing.tv.length} TV announcements.`);

  const outPath = path.join(__dirname, "..", "data", "briefing.json");
  await fs.writeFile(outPath, JSON.stringify(briefing, null, 2));
  console.log(`Written to ${outPath}`);

  const archiveDir = path.join(__dirname, "..", "data", "archive");
  await fs.mkdir(archiveDir, { recursive: true });
  const archivePath = path.join(archiveDir, `${today}.json`);
  await fs.writeFile(archivePath, JSON.stringify(briefing, null, 2));
  console.log(`Archive written to ${archivePath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
