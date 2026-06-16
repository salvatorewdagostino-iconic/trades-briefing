import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 900;

type Source = { name: string; url: string };
type Item = { title: string; talent: string; announcement: string; sources: Source[]; sub: string; section: "Film" | "TV" };
type DayBriefing = { dateIso: string; dateLabel: string; film: Item[]; tv: Item[]; total: number };

const TRADE_LOGOS: Record<string, string> = {
  Deadline: "/logos/deadline.svg",
  Variety: "/logos/variety.svg",
  "Hollywood Reporter": "/logos/hollywood-reporter.svg",
  IndieWire: "/logos/indiewire.svg",
  TheWrap: "/logos/thewrap.jpg",
};

async function getWeeklyData(): Promise<DayBriefing[]> {
  const days: DayBriefing[] = [];

  async function loadFile(filePath: string, dateIso: string, dateLabel: string) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(raw);
      const film: Item[] = (data.film ?? []).map((i: any) => ({ ...i, sub: i.studio, section: "Film" as const }));
      const tv: Item[] = (data.tv ?? []).map((i: any) => ({ ...i, sub: i.network, section: "TV" as const }));
      if (film.length + tv.length > 0) {
        days.push({ dateIso, dateLabel, film, tv, total: film.length + tv.length });
      }
    } catch { /* skip */ }
  }

  // Today
  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];
  const todayLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  await loadFile(path.join(process.cwd(), "data", "briefing.json"), todayIso, `Today — ${todayLabel}`);

  // Past 6 days from archive
  const archiveDir = path.join(process.cwd(), "data", "archive");
  try {
    const files = await fs.readdir(archiveDir);
    const sorted = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 6);

    for (const dateIso of sorted) {
      if (dateIso === todayIso) continue;
      const [y, m, d] = dateIso.split("-").map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
      await loadFile(path.join(archiveDir, `${dateIso}.json`), dateIso, label);
    }
  } catch { /* no archive */ }

  return days;
}

export default async function WeeklyPage() {
  const days = await getWeeklyData();
  const totalItems = days.reduce((sum, d) => sum + d.total, 0);

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b border-zinc-200 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image src="/iconic-logo.png" alt="Iconic" width={120} height={36} className="invert" />
            </Link>
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-zinc-500">Weekly Rollup</span>
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

      <div className="max-w-5xl mx-auto px-8 py-12 flex flex-col gap-16">
        <p className="font-sans text-sm tracking-[0.2em] uppercase text-zinc-500 font-medium border-b border-zinc-200 pb-4">
          {days.length} days — {totalItems} announcements
        </p>

        {days.length === 0 && (
          <p className="font-serif text-zinc-500 text-base font-light">No data yet — check back after the first week.</p>
        )}

        {days.map((day) => (
          <section key={day.dateIso}>
            {/* Day header */}
            <div className="flex items-baseline justify-between border-b border-zinc-200 pb-3 mb-8">
              <h2 className="font-serif text-2xl font-light">{day.dateLabel}</h2>
              <div className="flex items-center gap-3">
                <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-400">
                  {day.film.length} film · {day.tv.length} tv
                </span>
                <Link
                  href={`/archive/${day.dateIso}`}
                  className="font-sans text-[10px] tracking-widest uppercase border border-zinc-200 px-2.5 py-1.5 text-zinc-400 hover:opacity-60 transition-opacity"
                >
                  Full day →
                </Link>
              </div>
            </div>

            <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
              {[...day.film, ...day.tv].map((item, i) => (
                <div key={i} className="border-t border-zinc-200 pt-5 pb-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-lg font-light leading-snug flex-1">
                      {item.sources[0]?.url ? (
                        <a href={item.sources[0].url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 transition-colors">
                          {item.title}
                        </a>
                      ) : item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-400 whitespace-nowrap">{item.sub}</span>
                      <span className={`font-sans text-[9px] tracking-widest uppercase px-1 py-0.5 ${item.section === "Film" ? "bg-zinc-100 text-zinc-500" : "bg-zinc-900 text-white"}`}>
                        {item.section}
                      </span>
                    </div>
                  </div>
                  {item.talent && (
                    <p className="font-sans text-xs tracking-wide uppercase text-zinc-400">{item.talent}</p>
                  )}
                  <p className="font-serif text-zinc-600 text-sm font-light leading-relaxed">{item.announcement}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.sources.map((s) => (
                      <a key={s.name + s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center border border-zinc-200 px-2 py-1 hover:opacity-60 transition-opacity" title={s.name}>
                        {TRADE_LOGOS[s.name] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={TRADE_LOGOS[s.name]} alt={s.name} className="w-auto object-contain"
                            style={{ height: s.name === "TheWrap" ? 22 : 10, maxWidth: 80 }} />
                        ) : (
                          <span className="text-[9px] font-sans tracking-widest uppercase text-zinc-500">{s.name}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-zinc-200 mt-8 py-8 text-center">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-400">
          Deadline &nbsp;·&nbsp; Hollywood Reporter &nbsp;·&nbsp; Variety &nbsp;·&nbsp; IndieWire &nbsp;·&nbsp; TheWrap
        </p>
      </footer>
    </main>
  );
}
