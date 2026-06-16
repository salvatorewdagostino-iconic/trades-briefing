import { promises as fs } from "fs";
import path from "path";
import BriefingClient from "./BriefingClient";

export const revalidate = 60;

async function getBriefing() {
  const filePath = path.join(process.cwd(), "data", "briefing.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  return {
    date: data.date ?? "",
    summary: data.summary ?? "",
    lastUpdated: data.lastUpdated ?? null,
    film: (data.film ?? []).slice(0, 30),
    tv: (data.tv ?? []).slice(0, 30),
  };
}

export default async function Home() {
  const briefing = await getBriefing();
  return <BriefingClient {...briefing} />;
}
