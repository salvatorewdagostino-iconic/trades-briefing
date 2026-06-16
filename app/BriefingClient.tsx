"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LiveClock from "./LiveClock";

type Source = { name: string; url: string };
type FilmItem = { title: string; studio: string; talent: string; announcement: string; sources: Source[] };
type TvItem = { title: string; network: string; talent: string; announcement: string; sources: Source[] };

const TRADE_LOGOS: Record<string, string> = {
  Deadline: "/logos/deadline.svg",
  Variety: "/logos/variety.svg",
  "Hollywood Reporter": "/logos/hollywood-reporter.svg",
  IndieWire: "/logos/indiewire.svg",
  TheWrap: "/logos/thewrap.jpg",
};

function SourceBadge({ source, dark }: { source: Source; dark: boolean }) {
  const logo = TRADE_LOGOS[source.name];
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center border px-2.5 py-1.5 transition-opacity hover:opacity-60 ${dark ? "border-zinc-700" : "border-zinc-200"}`}
      title={source.name}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={source.name}
          className={`w-auto object-contain ${dark ? "invert" : ""}`}
          style={{ height: source.name === "TheWrap" ? 26 : 12, maxWidth: 100 }}
        />
      ) : (
        <span className={`text-[10px] font-sans font-medium tracking-widest uppercase ${dark ? "text-zinc-300" : "text-zinc-600"}`}>
          {source.name}
        </span>
      )}
    </a>
  );
}

function NewBadge({ dark }: { dark: boolean }) {
  return (
    <span className={`inline-block text-[9px] font-sans font-semibold tracking-widest uppercase px-1.5 py-0.5 ml-2 align-middle ${dark ? "bg-white text-black" : "bg-black text-white"}`}>
      NEW
    </span>
  );
}

function Card({
  title, sub, talent, announcement, sources, isNew, dark, onTalentClick,
}: {
  title: string; sub: string; talent: string; announcement: string;
  sources: Source[]; isNew: boolean; dark: boolean; onTalentClick: (t: string) => void;
}) {
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const body = dark ? "text-zinc-300" : "text-zinc-700";
  const border = dark ? "border-zinc-800" : "border-zinc-200";
  const primaryUrl = sources[0]?.url;

  return (
    <div className={`border-t ${border} pt-6 pb-6 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-xl font-light leading-snug">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className={`hover:${muted} transition-colors`}>
              {title}
            </a>
          ) : title}
          {isNew && <NewBadge dark={dark} />}
        </h3>
        <span className={`font-sans text-[10px] tracking-widest uppercase ${muted} whitespace-nowrap shrink-0 pt-1`}>{sub}</span>
      </div>
      {talent && (
        <button
          onClick={() => onTalentClick(talent.split(/\s*\(/)[0].trim())}
          className={`font-sans text-xs tracking-wide uppercase ${muted} text-left transition-colors hover:underline cursor-pointer`}
          title="Filter by this talent"
        >
          {talent}
        </button>
      )}
      <p className={`font-serif ${body} text-base font-light leading-relaxed`}>{announcement}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {sources.map((s) => <SourceBadge key={s.name + s.url} source={s} dark={dark} />)}
      </div>
    </div>
  );
}

export default function BriefingClient({
  film, tv, date, summary, lastUpdated,
}: {
  film: FilmItem[]; tv: TvItem[]; date: string; summary: string; lastUpdated?: string;
}) {
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [talentFilter, setTalentFilter] = useState("");
  const [seenTitles, setSeenTitles] = useState<Set<string>>(new Set());
  const [timeAgo, setTimeAgo] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("darkMode") === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    const seen: string[] = JSON.parse(localStorage.getItem("seenTitles") || "[]");
    setSeenTitles(new Set(seen));
    const allTitles = [...film, ...tv].map((i) => i.title);
    localStorage.setItem("seenTitles", JSON.stringify(allTitles));
  }, [film, tv]);

  useEffect(() => {
    if (!lastUpdated) return;
    function tick() {
      const mins = Math.floor((Date.now() - new Date(lastUpdated!).getTime()) / 60000);
      if (mins < 1) setTimeAgo("just now");
      else if (mins < 60) setTimeAgo(`${mins}m ago`);
      else setTimeAgo(`${Math.floor(mins / 60)}h ago`);
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  const activeQuery = (talentFilter || search).toLowerCase().trim();

  const filterItems = <T extends { title: string; talent: string; announcement: string }>(
    items: T[],
    extraKey: (i: T) => string
  ) =>
    !activeQuery
      ? items
      : items.filter(
          (i) =>
            i.title.toLowerCase().includes(activeQuery) ||
            i.talent.toLowerCase().includes(activeQuery) ||
            i.announcement.toLowerCase().includes(activeQuery) ||
            extraKey(i).toLowerCase().includes(activeQuery)
        );

  const filteredFilm = filterItems(film, (i) => i.studio);
  const filteredTv = filterItems(tv, (i) => i.network);
  const isNew = (title: string) => !seenTitles.has(title);

  const copyDigest = () => {
    const lines = [
      `ICONIC TRADES BRIEFING — ${date}`,
      "",
      `FILM ANNOUNCEMENTS (${film.length})`,
      ...film.map((i) => `• ${i.title} [${i.studio}] — ${i.announcement}`),
      "",
      `TELEVISION ANNOUNCEMENTS (${tv.length})`,
      ...tv.map((i) => `• ${i.title} [${i.network}] — ${i.announcement}`),
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const bg = dark ? "bg-zinc-950 text-white" : "bg-white text-black";
  const headerBg = dark ? "bg-zinc-950" : "bg-white";
  const border = dark ? "border-zinc-800" : "border-zinc-200";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";

  return (
    <main className={`min-h-screen ${bg} transition-colors duration-200`}>
      {/* Header */}
      <header className={`border-b ${border} sticky top-0 z-10 ${headerBg}`}>
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image
              src="/iconic-logo.png"
              alt="Iconic"
              width={120}
              height={36}
              className={dark ? "" : "invert"}
            />
            <span className={`font-sans text-xs tracking-[0.3em] uppercase ${muted}`}>
              Trades Briefing
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`font-sans text-xs tracking-widest font-mono ${muted}`}>
                <LiveClock />
              </p>
              <p className={`font-sans text-[10px] tracking-widest uppercase ${muted} mt-0.5`}>
                {timeAgo ? `Updated ${timeAgo}` : "Updates every 30 min"} · {date}
              </p>
            </div>
            <button
              onClick={copyDigest}
              className={`font-sans text-[10px] tracking-widest uppercase border px-3 py-2 ${border} ${muted} hover:opacity-60 transition-opacity`}
            >
              {copied ? "Copied!" : "Copy Digest"}
            </button>
            <button
              onClick={toggleDark}
              className={`font-sans text-[10px] tracking-widest uppercase border px-3 py-2 ${border} ${muted} hover:opacity-60 transition-opacity`}
            >
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className={`border-t ${border}`}>
          <div className="max-w-5xl mx-auto px-8 py-3 flex items-center gap-4">
            <svg className={`w-3 h-3 shrink-0 ${muted}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search projects, talent, studios…"
              value={talentFilter || search}
              onChange={(e) => { setTalentFilter(""); setSearch(e.target.value); }}
              className={`flex-1 font-sans text-xs tracking-wide bg-transparent border-0 outline-none ${dark ? "text-white placeholder:text-zinc-600" : "text-black placeholder:text-zinc-400"}`}
            />
            {(search || talentFilter) && (
              <button
                onClick={() => { setSearch(""); setTalentFilter(""); }}
                className={`font-sans text-[10px] tracking-widest uppercase ${muted} hover:opacity-60 transition-opacity`}
              >
                Clear ×
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12 flex flex-col gap-16">
        <p className={`font-sans text-sm tracking-[0.2em] uppercase ${muted} font-medium border-b ${border} pb-4`}>
          {summary}
        </p>

        {/* Film */}
        <section>
          <h2 className={`font-sans ${muted} mb-8 text-sm tracking-[0.2em] uppercase font-medium`}>
            Film Announcements — {filteredFilm.length} items
          </h2>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
            {filteredFilm.map((item) => (
              <Card
                key={item.title}
                title={item.title}
                sub={item.studio}
                talent={item.talent}
                announcement={item.announcement}
                sources={item.sources}
                isNew={isNew(item.title)}
                dark={dark}
                onTalentClick={setTalentFilter}
              />
            ))}
          </div>
        </section>

        {/* TV */}
        <section>
          <h2 className={`font-sans ${muted} mb-8 text-sm tracking-[0.2em] uppercase font-medium`}>
            Television Announcements — {filteredTv.length} items
          </h2>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
            {filteredTv.map((item) => (
              <Card
                key={item.title}
                title={item.title}
                sub={item.network}
                talent={item.talent}
                announcement={item.announcement}
                sources={item.sources}
                isNew={isNew(item.title)}
                dark={dark}
                onTalentClick={setTalentFilter}
              />
            ))}
          </div>
        </section>
      </div>

      <footer className={`border-t ${border} mt-8 py-8 text-center`}>
        <p className={`font-sans text-[10px] tracking-[0.3em] uppercase ${muted}`}>
          Deadline &nbsp;·&nbsp; Hollywood Reporter &nbsp;·&nbsp; Variety &nbsp;·&nbsp; IndieWire &nbsp;·&nbsp; TheWrap
        </p>
      </footer>
    </main>
  );
}
