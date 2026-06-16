import { promises as fs } from "fs";
import path from "path";
import Image from "next/image";
import LiveClock from "./LiveClock";

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

export const revalidate = 900;

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
  const color = TRADE_COLORS[source.name] ?? "bg-zinc-700";
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[10px] font-sans font-medium tracking-widest uppercase text-white px-2 py-0.5 ${color} hover:opacity-70 transition-opacity`}
    >
      {source.name}
      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="border-t border-zinc-800 pt-6 pb-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-white text-xl font-light leading-snug">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
              {item.title}
            </a>
          ) : item.title}
        </h3>
        <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-500 whitespace-nowrap shrink-0 pt-1">
          {item.studio}
        </span>
      </div>
      {item.talent && (
        <p className="font-sans text-xs tracking-wide text-zinc-500 uppercase">
          {item.talent}
        </p>
      )}
      <p className="font-serif text-zinc-300 text-base font-light leading-relaxed">{item.announcement}</p>
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
    <div className="border-t border-zinc-800 pt-6 pb-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-white text-xl font-light leading-snug">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
              {item.title}
            </a>
          ) : item.title}
        </h3>
        <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-500 whitespace-nowrap shrink-0 pt-1">
          {item.network}
        </span>
      </div>
      {item.talent && (
        <p className="font-sans text-xs tracking-wide text-zinc-500 uppercase">
          {item.talent}
        </p>
      )}
      <p className="font-serif text-zinc-300 text-base font-light leading-relaxed">{item.announcement}</p>
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
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-black z-10">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image src="/iconic-logo.png" alt="Iconic" width={72} height={22} />
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-500">
              Trades Briefing
            </span>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs tracking-widest text-zinc-400 font-mono"><LiveClock /></p>
            <p className="font-sans text-[10px] tracking-widest uppercase text-zinc-600 mt-0.5">Updates every 15 min · {briefing.date}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12 flex flex-col gap-16">

        {/* Summary */}
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-500 border-b border-zinc-800 pb-4">
          {briefing.summary}
        </p>

        {/* Film Section */}
        <section>
          <h2 className="font-sans text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-8">
            Film Announcements &mdash; {briefing.film.length} items
          </h2>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
            {briefing.film.map((item) => (
              <FilmCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        {/* TV Section */}
        <section>
          <h2 className="font-sans text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-8">
            Television Announcements &mdash; {briefing.tv.length} items
          </h2>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
            {briefing.tv.map((item) => (
              <TvCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-zinc-900 mt-8 py-8 text-center">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-700">
          Deadline &nbsp;·&nbsp; Hollywood Reporter &nbsp;·&nbsp; Variety &nbsp;·&nbsp; IndieWire &nbsp;·&nbsp; TheWrap
        </p>
      </footer>
    </main>
  );
}
