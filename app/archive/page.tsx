import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 900;

async function getArchiveDates() {
  const archiveDir = path.join(process.cwd(), "data", "archive");
  try {
    const files = await fs.readdir(archiveDir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort((a, b) => b.localeCompare(a)); // newest first
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default async function ArchivePage() {
  const dates = await getArchiveDates();

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b border-zinc-200 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image src="/iconic-logo.png" alt="Iconic" width={120} height={36} className="invert" />
            </Link>
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-zinc-500">
              Archive
            </span>
          </div>
          <Link
            href="/"
            className="font-sans text-[10px] tracking-widest uppercase border border-zinc-200 px-3 py-2 text-zinc-500 hover:opacity-60 transition-opacity"
          >
            ← Today
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="font-sans text-sm tracking-[0.2em] uppercase text-zinc-500 font-medium border-b border-zinc-200 pb-4 mb-12">
          Past Briefings — {dates.length} days
        </h1>

        <div className="flex flex-col">
          {dates.length === 0 && (
            <p className="font-serif text-zinc-500 text-base font-light">No archived briefings yet.</p>
          )}
          {dates.map((date) => (
            <Link
              key={date}
              href={`/archive/${date}`}
              className="border-t border-zinc-200 py-5 flex items-center justify-between group hover:opacity-60 transition-opacity"
            >
              <span className="font-serif text-xl font-light">{formatDate(date)}</span>
              <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-400 group-hover:text-zinc-600 transition-colors">
                View →
              </span>
            </Link>
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
