import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import BriefingClient from "../../BriefingClient";

export const revalidate = 3600;

async function getArchiveBriefing(date: string) {
  const filePath = path.join(process.cwd(), "data", "archive", `${date}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return {
      date: data.date ?? date,
      summary: data.summary ?? "",
      lastUpdated: data.lastUpdated ?? null,
      film: (data.film ?? []).slice(0, 30),
      tv: (data.tv ?? []).slice(0, 30),
    };
  } catch {
    return null;
  }
}

export default async function ArchiveDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const briefing = await getArchiveBriefing(date);
  if (!briefing) notFound();

  return (
    <>
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-8 py-3 flex items-center gap-4">
          <Link
            href="/archive"
            className="font-sans text-[10px] tracking-widest uppercase text-zinc-400 hover:opacity-60 transition-opacity"
          >
            ← Archive
          </Link>
          <span className="font-sans text-[10px] tracking-widest uppercase text-zinc-300">·</span>
          <Link
            href="/"
            className="font-sans text-[10px] tracking-widest uppercase text-zinc-400 hover:opacity-60 transition-opacity"
          >
            Today
          </Link>
        </div>
      </div>
      <BriefingClient {...briefing} isArchive />
    </>
  );
}
