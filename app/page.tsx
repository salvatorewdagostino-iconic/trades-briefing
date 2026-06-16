import { promises as fs } from "fs";
import path from "path";

type Source = { name: string; url: string };

type FilmItem = {
  title: string;
  studio: string;
  talent: string;
  announcement: string;
  sources: Source[];
};

type TvItem = {
  title: string;
  network: string;
  talent: string;
  announcement: string;
  sources: Source[];
};

type Briefing = {
  date: string;
  summary: string;
  film: FilmItem[];
  tv: TvItem[];
};

export const revalidate = 900; // revalidate every 15 minutes

async function getBriefing(): Promise<Briefing> {
  const filePath = path.join(process.cwd(), "data", "briefing.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  return {
    ...data,
    film: (data.film ?? []).slice(0, 30),
    tv: (data.tv ?? []).slice(0, 30),
  };
}

const TRADE_COLORS: Record<string, string> = {
  Deadline: "bg-red-600",
  Variety: "bg-purple-600",
  "Hollywood Reporter": "bg-blue-600",
  IndieWire: "bg-orange-500",
  TheWrap: "bg-teal-600",
};

function SourceBadge({ source }: { source: Source }) {
  const color = TRADE_COLORS[source.name] ?? "bg-zinc-600";
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-xs font-semibold text-white px-2 py-0.5 rounded ${color} hover:opacity-80 transition-opacity`}
    >
      {source.name}
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  );
}

function FilmCard({ item }: { item: FilmItem }) {
  const primaryUrl = item.sources[0]?.url;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col gap-3 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-bold text-lg leading-tight">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline underline-offset-2 decoration-zinc-600 hover:decoration-amber-400 transition-colors">
              {item.title}
            </a>
          ) : item.title}
        </h3>
        <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded whitespace-nowrap shrink-0">
          {item.studio}
        </span>
      </div>
      {item.talent && (
        <p className="text-zinc-400 text-sm">
          <span className="text-zinc-500 uppercase text-xs tracking-wider font-semibold">Talent · </span>
          {item.talent}
        </p>
      )}
      <p className="text-zinc-300 text-sm leading-relaxed">{item.announcement}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {item.sources.map((s) => (
          <SourceBadge key={s.name + s.url} source={s} />
        ))}
      </div>
    </div>
  );
}

function TvCard({ item }: { item: TvItem }) {
  const primaryUrl = item.sources[0]?.url;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col gap-3 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-bold text-lg leading-tight">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline underline-offset-2 decoration-zinc-600 hover:decoration-amber-400 transition-colors">
              {item.title}
            </a>
          ) : item.title}
        </h3>
        <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded whitespace-nowrap shrink-0">
          {item.network}
        </span>
      </div>
      {item.talent && (
        <p className="text-zinc-400 text-sm">
          <span className="text-zinc-500 uppercase text-xs tracking-wider font-semibold">Talent · </span>
          {item.talent}
        </p>
      )}
      <p className="text-zinc-300 text-sm leading-relaxed">{item.announcement}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {item.sources.map((s) => (
          <SourceBadge key={s.name + s.url} source={s} />
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const briefing = await getBriefing();

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight">🎬 TRADES BRIEFING</span>
          <div className="text-right">
            <p className="text-zinc-400 text-sm">{briefing.date}</p>
            <p className="text-zinc-600 text-xs">Updated daily at 6am PT</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
          <p className="text-zinc-300 text-sm">{briefing.summary}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TRADE_COLORS).map(([name, color]) => (
              <span key={name} className={`text-xs text-white font-semibold px-2 py-0.5 rounded ${color}`}>
                {name}
              </span>
            ))}
          </div>
        </div>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎬</span>
            <h2 className="text-2xl font-black tracking-tight">FILM ANNOUNCEMENTS</h2>
            <span className="ml-auto text-zinc-500 text-sm font-medium">{briefing.film.length} items</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {briefing.film.map((item) => (
              <FilmCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📺</span>
            <h2 className="text-2xl font-black tracking-tight">TELEVISION ANNOUNCEMENTS</h2>
            <span className="ml-auto text-zinc-500 text-sm font-medium">{briefing.tv.length} items</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {briefing.tv.map((item) => (
              <TvCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-zinc-900 mt-16 py-8 text-center text-zinc-700 text-xs">
        Sourced from Deadline · Hollywood Reporter · Variety · IndieWire · TheWrap
      </footer>
    </main>
  );
}
