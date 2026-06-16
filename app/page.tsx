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

const TRADE_LOGOS: Record<string, string> = {
  Deadline: "/logos/deadline.svg",
  Variety: "/logos/variety.svg",
  "Hollywood Reporter": "/logos/hollywood-reporter.svg",
  IndieWire: "/logos/indiewire.svg",
  TheWrap: "/logos/thewrap.jpg",
};

function SourceBadge({ source }: { source: Source }) {
  const logo = TRADE_LOGOS[source.name];
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center border border-zinc-200 px-2.5 py-1.5 hover:border-zinc-400 transition-colors"
      title={source.name}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={source.name}
          className="h-3 w-auto object-contain"
          style={{ maxWidth: 80 }}
        />
      ) : (
        <span className="text-[10px] font-sans font-medium tracking-widest uppercase text-zinc-600">
          {source.name}
        </span>
      )}
    </a>
  );
}

function FilmCard({ item }: { item: FilmItem }) {
  const primaryUrl = item.sources[0]?.url;
  return (
    <div className="border-t border-zinc-200 pt-6 pb-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-black text-xl font-light leading-snug">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 transition-colors">
              {item.title}
            </a>
          ) : item.title}
        </h3>
        <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-400 whitespace-nowrap shrink-0 pt-1">
          {item.studio}
        </span>
      </div>
      {item.talent && (
        <p className="font-sans text-xs tracking-wide text-zinc-500 uppercase">
          {item.talent}
        </p>
      )}
      <p className="font-serif text-zinc-700 text-base font-light leading-relaxed">{item.announcement}</p>
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
    <div className="border-t border-zinc-200 pt-6 pb-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-black text-xl font-light leading-snug">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 transition-colors">
              {item.title}
            </a>
          ) : item.title}
        </h3>
        <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-400 whitespace-nowrap shrink-0 pt-1">
          {item.network}
        </span>
      </div>
      {item.talent && (
        <p className="font-sans text-xs tracking-wide text-zinc-500 uppercase">
          {item.talent}
        </p>
      )}
      <p className="font-serif text-zinc-700 text-base font-light leading-relaxed">{item.announcement}</p>
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
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-zinc-200 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image src="/iconic-logo.png" alt="Iconic" width={120} height={36} className="invert" />
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-zinc-400">
              Trades Briefing
            </span>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs tracking-widest text-zinc-500 font-mono"><LiveClock /></p>
            <p className="font-sans text-[10px] tracking-widest uppercase text-zinc-400 mt-0.5">Updates every 30 min · {briefing.date}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12 flex flex-col gap-16">

        {/* Summary */}
        <p className="font-sans text-sm tracking-[0.2em] uppercase text-zinc-500 font-medium border-b border-zinc-200 pb-4">
          {briefing.summary}
        </p>

        {/* Film Section */}
        <section>
          <h2 className="font-sans text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-8 text-sm tracking-[0.2em] font-medium">
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
          <h2 className="font-sans text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-8 text-sm tracking-[0.2em] font-medium">
            Television Announcements &mdash; {briefing.tv.length} items
          </h2>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
            {briefing.tv.map((item) => (
              <TvCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-zinc-200 mt-8 py-8 text-center">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-400">
          Deadline &nbsp;·&nbsp; Hollywood Reporter &nbsp;·&nbsp; Variety &nbsp;·&nbsp; IndieWire &nbsp;·&nbsp; TheWrap
        </p>
      </footer>
    </main>
  );
}
