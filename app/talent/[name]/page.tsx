import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 900;

type Source = { name: string; url: string };
type Item = { title: string; talent: string; announcement: string; sources: Source[]; sub: string; date: string; section: "Film" | "TV" };

const TRADE_LOGOS: Record<string, string> = {
  Deadline: "/logos/deadline.svg",
  Variety: "/logos/variety.svg",
  "Hollywood Reporter": "/logos/hollywood-reporter.svg",
  IndieWire: "/logos/indiewire.svg",
  TheWrap: "/logos/thewrap.jpg",
};

async function getTalentAppearances(talentName: string): Promise<Item[]> {
  const name = decodeURIComponent(talentName).toLowerCase();
  const results: Item[] = [];

  async function scanFile(filePath: string, dateLabel: string) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(raw);
      for (const item of data.film ?? []) {
        if (item.talent?.toLowerCase().includes(name) || item.title?.toLowerCase().includes(name)) {
          results.push({ ...item, sub: item.studio, date: dateLabel, section: "Film" });
        }
      }
      for (const item of data.tv ?? []) {
        if (item.talent?.toLowerCase().includes(name) || item.title?.toLowerCase().includes(name)) {
          results.push({ ...item, sub: item.network, date: dateLabel, section: "TV" });
        }
      }
    } catch { /* skip missing files */ }
  }

  // Today's briefing
  await scanFile(path.join(process.cwd(), "data", "briefing.json"), "Today");

  // Archive
  const archiveDir = path.join(process.cwd(), "data", "archive");
  try {
    const files = await fs.readdir(archiveDir);
    const sorted = files.filter((f) => f.endsWith(".json")).sort((a, b) => b.localeCompare(a));
    for (const file of sorted) {
      const dateStr = file.replace(".json", "");
      const [y, m, d] = dateStr.split("-").map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      await scanFile(path.join(archiveDir, file), label);
    }
  } catch { /* no archive yet */ }

  // Deduplicate by title+date
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.title}|${r.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function TalentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const displayName = decodeURIComponent(name).replace(/-/g, " ");
  const appearances = await getTalentAppearances(name);

  if (appearances.length === 0) notFound();

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b border-zinc-200 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image src="/iconic-logo.png" alt="Iconic" width={120} height={36} className="invert" />
            </Link>
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-zinc-500">Talent</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/archive" className="font-sans text-[10px] tracking-widest uppercase border border-zinc-200 px-3 py-2 text-zinc-500 hover:opacity-60 transition-opacity">
              Archive
            </Link>
            <Link href="/" className="font-sans text-[10px] tracking-widest uppercase border border-zinc-200 px-3 py-2 text-zinc-500 hover:opacity-60 transition-opacity">
              ← Today
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12 flex flex-col gap-12">
        <div className="border-b border-zinc-200 pb-6">
          <h1 className="font-serif text-4xl font-light mb-2 capitalize">{displayName}</h1>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-400">
            {appearances.length} appearance{appearances.length !== 1 ? "s" : ""} in the trades
          </p>
        </div>

        <div className="flex flex-col">
          {appearances.map((item, i) => (
            <div key={i} className="border-t border-zinc-200 pt-6 pb-6 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-xl font-light leading-snug">
                  {item.sources[0]?.url ? (
                    <a href={item.sources[0].url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 transition-colors">
                      {item.title}
                    </a>
                  ) : item.title}
                </h3>
                <div className="text-right shrink-0 pt-1 flex flex-col gap-1">
                  <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-400">{item.sub}</span>
                  <span className={`font-sans text-[9px] tracking-widest uppercase px-1.5 py-0.5 self-end ${item.section === "Film" ? "bg-zinc-100 text-zinc-500" : "bg-zinc-900 text-white"}`}>
                    {item.section}
                  </span>
                </div>
              </div>
              {item.talent && (
                <p className="font-sans text-xs tracking-wide uppercase text-zinc-500">{item.talent}</p>
              )}
              <p className="font-serif text-zinc-700 text-base font-light leading-relaxed">{item.announcement}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {item.sources.map((s) => (
                    <a key={s.name + s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center border border-zinc-200 px-2.5 py-1.5 hover:opacity-60 transition-opacity" title={s.name}>
                      {TRADE_LOGOS[s.name] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={TRADE_LOGOS[s.name]} alt={s.name} className="w-auto object-contain"
                          style={{ height: s.name === "TheWrap" ? 26 : 12, maxWidth: 100 }} />
                      ) : (
                        <span className="text-[10px] font-sans font-medium tracking-widest uppercase text-zinc-600">{s.name}</span>
                      )}
                    </a>
                  ))}
                </div>
                <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-400">{item.date}</span>
              </div>
            </div>
          ))}
          <div className="border-t border-zinc-200" />
        </div>
      </div>

      <footer className="border-t border-zinc-200 mt-8 py-8 text-center">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-400">
          Deadline &nbsp;·&nbsp; Hollywood Reporter &nbsp;·&nbsp; Variety &nbsp;·&nbsp; IndieWire &nbsp;·&nbsp; TheWrap
        </p>
      </footer>
    </main>
  );
}
