import BriefingClient from "./BriefingClient";

export const revalidate = 60;

async function getBriefing() {
  const res = await fetch(
    "https://raw.githubusercontent.com/salvatorewdagostino-iconic/trades-briefing/main/data/briefing.json",
    { next: { revalidate: 60 } }
  );
  const data = await res.json();
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
