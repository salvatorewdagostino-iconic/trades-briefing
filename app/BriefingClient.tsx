"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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

const STUDIO_LOGOS: Array<{ keywords: string[]; file: string }> = [
  { keywords: ["netflix"],                                     file: "netflix.svg" },
  { keywords: ["amazon", "prime video", "mgm"],               file: "amazon.svg" },
  { keywords: ["apple", "a24".slice(0,0)+"apple tv"],         file: "apple.svg" },
  { keywords: ["hbo"],                                         file: "hbo.svg" },
  { keywords: ["max"],                                         file: "max.svg" },
  { keywords: ["warner", "wb ", "w.b."],                      file: "warnerbros.svg" },
  { keywords: ["nbc", "peacock"],                              file: "nbc.svg" },
  { keywords: ["paramount+", "paramount plus", "p+"],         file: "paramount-plus.svg" },
  { keywords: ["showtime"],                                    file: "showtime.svg" },
];

function getStudioLogo(name: string): string | null {
  const lower = name.toLowerCase();
  for (const { keywords, file } of STUDIO_LOGOS) {
    if (keywords.some((k) => lower.includes(k))) return `/studio-logos/${file}`;
  }
  return null;
}

function StudioLabel({ name, dark }: { name: string; dark: boolean }) {
  const logo = getStudioLogo(name);
  if (!logo) return <span className={`font-sans text-[10px] tracking-widest uppercase whitespace-nowrap ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{name}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={name}
      title={name}
      className={`w-auto object-contain ${dark ? "invert" : ""}`}
      style={{ height: 14, maxWidth: 72, opacity: dark ? 0.7 : 0.5 }}
    />
  );
}

function BookmarkIcon({ active, dark }: { active: boolean; dark: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={active ? (dark ? "text-white" : "text-black") : (dark ? "text-zinc-600" : "text-zinc-300")}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareButton({ title, sub, announcement, sources, dark }: {
  title: string; sub: string; announcement: string; sources: Source[]; dark: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const share = () => {
    const trade = sources[0]?.name ?? "";
    const url = sources[0]?.url ?? "";
    const text = `${title} [${sub}] — ${announcement}${trade ? ` Via ${trade}.` : ""}${url ? ` ${url}` : ""}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={share} title="Copy to share" className={`hover:opacity-60 transition-opacity ${dark ? "text-zinc-600" : "text-zinc-300"} hover:${dark ? "text-zinc-300" : "text-zinc-600"}`}>
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={dark ? "text-white" : "text-black"}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}

function Card({
  title, sub, talent, announcement, sources, isNew, isTracked, dark, onTalentClick, onTrackToggle,
}: {
  title: string; sub: string; talent: string; announcement: string;
  sources: Source[]; isNew: boolean; isTracked: boolean; dark: boolean;
  onTalentClick: (t: string) => void; onTrackToggle: (title: string) => void;
}) {
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const body = dark ? "text-zinc-300" : "text-zinc-700";
  const border = dark ? "border-zinc-800" : "border-zinc-200";
  const trackedBorder = dark ? "border-l-2 border-l-white pl-4" : "border-l-2 border-l-black pl-4";
  const primaryUrl = sources[0]?.url;

  return (
    <div className={`border-t ${border} pt-6 pb-6 flex flex-col gap-3 ${isTracked ? trackedBorder : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl font-light leading-snug flex-1">
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className={`hover:${muted} transition-colors`}>
              {title}
            </a>
          ) : title}
          {isNew && (
            <span className={`inline-block text-[9px] font-sans font-semibold tracking-widest uppercase px-1.5 py-0.5 ml-2 align-middle ${dark ? "bg-white text-black" : "bg-black text-white"}`}>
              NEW
            </span>
          )}
          {isTracked && (
            <span className={`inline-block text-[9px] font-sans font-semibold tracking-widest uppercase px-1.5 py-0.5 ml-2 align-middle border ${dark ? "border-white text-white" : "border-black text-black"}`}>
              TRACKING
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <StudioLabel name={sub} dark={dark} />
          <ShareButton title={title} sub={sub} announcement={announcement} sources={sources} dark={dark} />
          <button
            onClick={() => onTrackToggle(title)}
            title={isTracked ? "Stop tracking" : "Track this project"}
            className="hover:opacity-60 transition-opacity"
          >
            <BookmarkIcon active={isTracked} dark={dark} />
          </button>
        </div>
      </div>
      {talent && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTalentClick(talent.split(/\s*\(/)[0].trim())}
            className={`font-sans text-xs tracking-wide uppercase ${muted} text-left transition-colors hover:underline cursor-pointer`}
            title="Filter by this talent"
          >
            {talent}
          </button>
          <a
            href={`/talent/${encodeURIComponent(talent.split(/\s*\(/)[0].trim().toLowerCase())}`}
            className={`font-sans text-[9px] tracking-widest uppercase border px-1.5 py-0.5 ${dark ? "border-zinc-700 text-zinc-500 hover:text-zinc-300" : "border-zinc-200 text-zinc-400 hover:text-zinc-600"} transition-colors`}
            title="View all appearances"
          >
            Profile
          </a>
        </div>
      )}
      <p className={`font-serif ${body} text-base font-light leading-relaxed`}>{announcement}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {sources.map((s) => <SourceBadge key={s.name + s.url} source={s} dark={dark} />)}
      </div>
    </div>
  );
}

export default function BriefingClient({
  film, tv, date, summary, lastUpdated, isArchive,
}: {
  film: FilmItem[]; tv: TvItem[]; date: string; summary: string; lastUpdated?: string; isArchive?: boolean;
}) {
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [talentFilter, setTalentFilter] = useState("");
  const [studioFilter, setStudioFilter] = useState("");
  const [seenTitles, setSeenTitles] = useState<Set<string>>(new Set());
  const [tracking, setTracking] = useState<Set<string>>(new Set());
  const [trackInput, setWatchInput] = useState("");
  const [showTracking, setShowTracking] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (localStorage.getItem("darkMode") === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    const seen: string[] = JSON.parse(localStorage.getItem("seenTitles") || "[]");
    setSeenTitles(new Set(seen));
    const allTitles = [...film, ...tv].map((i) => i.title);
    localStorage.setItem("seenTitles", JSON.stringify(allTitles));

    const watched: string[] = JSON.parse(localStorage.getItem("tracking") || "[]");
    setTracking(new Set(watched));
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

  const toggleTrack = (title: string) => {
    setTracking((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      localStorage.setItem("tracking", JSON.stringify([...next]));
      return next;
    });
  };

  const addTrackTerm = () => {
    const term = trackInput.trim();
    if (!term) return;
    setTracking((prev) => {
      const next = new Set(prev);
      next.add(term);
      localStorage.setItem("tracking", JSON.stringify([...next]));
      return next;
    });
    setWatchInput("");
  };

  const removeTrackTerm = (term: string) => {
    setTracking((prev) => {
      const next = new Set(prev);
      next.delete(term);
      localStorage.setItem("tracking", JSON.stringify([...next]));
      return next;
    });
  };

  const isTracked = (title: string, talent = "", sub = "") =>
    [...tracking].some((w) => {
      const wl = w.toLowerCase();
      return (
        title.toLowerCase().includes(wl) ||
        talent.toLowerCase().includes(wl) ||
        sub.toLowerCase().includes(wl)
      );
    });

  const activeQuery = (talentFilter || search).toLowerCase().trim();

  const filterItems = <T extends { title: string; talent: string; announcement: string }>(
    items: T[], extraKey: (i: T) => string
  ) =>
    items.filter((i) => {
      const matchesQuery = !activeQuery ||
        i.title.toLowerCase().includes(activeQuery) ||
        i.talent.toLowerCase().includes(activeQuery) ||
        i.announcement.toLowerCase().includes(activeQuery) ||
        extraKey(i).toLowerCase().includes(activeQuery);
      const matchesStudio = !studioFilter ||
        extraKey(i).toLowerCase().includes(studioFilter.toLowerCase());
      return matchesQuery && matchesStudio;
    });

  const filteredFilm = filterItems(film, (i) => i.studio);
  const filteredTv = filterItems(tv, (i) => i.network);
  const isNew = (title: string) => !seenTitles.has(title);

  const trackedToday = [...film, ...tv].filter((i) =>
    isTracked(i.title, i.talent, "studio" in i ? (i as FilmItem).studio : (i as TvItem).network)
  );

  // Trending: items covered by 2+ trades
  const trending = [...film, ...tv].filter((i) => i.sources.length >= 2);

  // Studio/streamer chips — pull unique values from today's data, sorted by frequency
  const studioCounts = new Map<string, number>();
  for (const i of film) studioCounts.set(i.studio, (studioCounts.get(i.studio) ?? 0) + 1);
  for (const i of tv) studioCounts.set(i.network, (studioCounts.get(i.network) ?? 0) + 1);
  const studioChips = [...studioCounts.entries()]
    .filter(([s]) => s && s.trim())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([s]) => s);

  const bg = dark ? "bg-zinc-950 text-white" : "bg-white text-black";
  const headerBg = dark ? "bg-zinc-950" : "bg-white";
  const border = dark ? "border-zinc-800" : "border-zinc-200";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const bodyText = dark ? "text-zinc-300" : "text-zinc-700";

  return (
    <main className={`min-h-screen ${bg} transition-colors duration-500 ease-in-out`}>
      {/* Header */}
      <header className={`border-b ${border} sticky top-0 z-10 ${headerBg} transition-colors duration-500 ease-in-out`}>
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image src="/iconic-logo.png" alt="Iconic" width={120} height={36} className={dark ? "" : "invert"} />
            <span className={`font-sans text-xs tracking-[0.3em] uppercase ${muted}`}>Trades Briefing</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`font-sans text-xs tracking-widest font-mono ${muted}`}><LiveClock /></p>
              <p className={`font-sans text-[10px] tracking-widest uppercase ${muted} mt-0.5`}>
                {timeAgo ? `Updated ${timeAgo}` : "Updates every 30 min"} · {date}
              </p>
            </div>
            <button
              onClick={() => setShowTracking((v) => !v)}
              className={`font-sans text-[10px] tracking-widest uppercase border px-3 py-2 ${border} ${muted} hover:opacity-60 transition-opacity relative`}
            >
              Tracking
              {tracking.size > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-sans font-bold w-4 h-4 flex items-center justify-center ${dark ? "bg-white text-black" : "bg-black text-white"}`}>
                  {tracking.size}
                </span>
              )}
            </button>
            {!isArchive && (
              <>
                <Link href="/weekly" className={`font-sans text-[10px] tracking-widest uppercase border px-3 py-2 ${border} ${muted} hover:opacity-60 transition-opacity`}>
                  Weekly
                </Link>
                <Link href="/archive" className={`font-sans text-[10px] tracking-widest uppercase border px-3 py-2 ${border} ${muted} hover:opacity-60 transition-opacity`}>
                  Archive
                </Link>
              </>
            )}
            <button onClick={toggleDark} className={`font-sans text-[10px] tracking-widest uppercase border px-3 py-2 ${border} ${muted} hover:opacity-60 transition-opacity`}>
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
            {(search || talentFilter || studioFilter) && (
              <button onClick={() => { setSearch(""); setTalentFilter(""); setStudioFilter(""); }} className={`font-sans text-[10px] tracking-widest uppercase ${muted} hover:opacity-60 transition-opacity`}>
                Clear ×
              </button>
            )}
          </div>
        </div>

        {/* Studio / streamer filter chips */}
        {studioChips.length > 0 && (
          <div className={`border-t ${border} overflow-x-auto`}>
            <div className="max-w-5xl mx-auto px-8 py-2.5 flex items-center gap-2 min-w-0">
              {studioChips.map((s) => {
                const active = studioFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStudioFilter(active ? "" : s)}
                    className={`font-sans text-[9px] tracking-widest uppercase whitespace-nowrap px-2.5 py-1.5 border transition-all ${
                      active
                        ? dark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                        : `${border} ${muted} hover:opacity-60`
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Tracking panel */}
      {showTracking && (
        <div className={`border-b ${border} ${headerBg}`}>
          <div className="max-w-5xl mx-auto px-8 py-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className={`font-sans text-[10px] tracking-[0.3em] uppercase font-medium ${muted}`}>
                Tracking {tracking.size > 0 ? `— ${tracking.size} project${tracking.size > 1 ? "s" : ""}` : ""}
              </h3>
              {trackedToday.length > 0 && (
                <span className={`font-sans text-[10px] tracking-widest uppercase ${dark ? "text-white" : "text-black"} font-semibold`}>
                  {trackedToday.length} match{trackedToday.length > 1 ? "es" : ""} today
                </span>
              )}
            </div>

            {/* Add by name */}
            <div className={`flex items-center gap-3 border ${border} px-4 py-2`}>
              <input
                type="text"
                placeholder="Add project, producer, or company to track…"
                value={trackInput}
                onChange={(e) => setWatchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTrackTerm()}
                className={`flex-1 font-sans text-xs tracking-wide bg-transparent border-0 outline-none ${dark ? "text-white placeholder:text-zinc-600" : "text-black placeholder:text-zinc-400"}`}
              />
              <button onClick={addTrackTerm} className={`font-sans text-[10px] tracking-widest uppercase ${muted} hover:opacity-60 transition-opacity`}>
                Add
              </button>
            </div>

            {/* Current tracking */}
            {tracking.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {[...tracking].map((term) => {
                  const hasMatch = [...film, ...tv].some((i) =>
                    i.title.toLowerCase().includes(term.toLowerCase()) ||
                    term.toLowerCase().includes(i.title.toLowerCase())
                  );
                  return (
                    <div
                      key={term}
                      className={`inline-flex items-center gap-2 border px-3 py-1.5 font-sans text-[10px] tracking-widest uppercase ${
                        hasMatch
                          ? dark ? "border-white text-white" : "border-black text-black"
                          : `${border} ${muted}`
                      }`}
                    >
                      {hasMatch && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      {term}
                      <button onClick={() => removeTrackTerm(term)} className="hover:opacity-60 transition-opacity ml-1">×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-8 py-12 flex flex-col gap-16">
        <p className={`font-sans text-sm tracking-[0.2em] uppercase ${muted} font-medium border-b ${border} pb-4`}>
          {summary}
        </p>

        {/* Watched today callout */}
        {trackedToday.length > 0 && !activeQuery && (
          <section>
            <h2 className={`font-sans mb-8 text-sm tracking-[0.2em] uppercase font-medium ${dark ? "text-white" : "text-black"}`}>
              Your Tracking — {trackedToday.length} match{trackedToday.length > 1 ? "es" : ""} today
            </h2>
            <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
              {trackedToday.map((item) => (
                <Card
                  key={item.title}
                  title={item.title}
                  sub={"studio" in item ? (item as FilmItem).studio : (item as TvItem).network}
                  talent={item.talent}
                  announcement={item.announcement}
                  sources={item.sources}
                  isNew={isNew(item.title)}
                  isTracked
                  dark={dark}
                  onTalentClick={setTalentFilter}
                  onTrackToggle={toggleTrack}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending — covered by 2+ trades */}
        {trending.length > 0 && !activeQuery && !studioFilter && (
          <section>
            <h2 className={`font-sans mb-8 text-sm tracking-[0.2em] uppercase font-medium ${dark ? "text-white" : "text-black"}`}>
              Trending — {trending.length} cross-trade stor{trending.length > 1 ? "ies" : "y"}
            </h2>
            <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-12">
              {trending.map((item) => (
                <Card
                  key={item.title}
                  title={item.title}
                  sub={"studio" in item ? (item as FilmItem).studio : (item as TvItem).network}
                  talent={item.talent}
                  announcement={item.announcement}
                  sources={item.sources}
                  isNew={isNew(item.title)}
                  isTracked={isTracked(item.title, item.talent, "studio" in item ? (item as FilmItem).studio : (item as TvItem).network)}
                  dark={dark}
                  onTalentClick={setTalentFilter}
                  onTrackToggle={toggleTrack}
                />
              ))}
            </div>
          </section>
        )}

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
                isTracked={isTracked(item.title, item.talent, "studio" in item ? (item as FilmItem).studio : (item as TvItem).network)}
                dark={dark}
                onTalentClick={setTalentFilter}
                onTrackToggle={toggleTrack}
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
                isTracked={isTracked(item.title, item.talent, "studio" in item ? (item as FilmItem).studio : (item as TvItem).network)}
                dark={dark}
                onTalentClick={setTalentFilter}
                onTrackToggle={toggleTrack}
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
