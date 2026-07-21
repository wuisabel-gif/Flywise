import { PlaneTakeoff } from "lucide-react";

export function EmptyResults({ hasSearched }: { hasSearched: boolean }) {
  return (
    <section className="empty-results">
      <PlaneTakeoff />
      <h2>{hasSearched ? "No close matches found" : "Ready when you are"}</h2>
      <p>{hasSearched ? "Try a wider departure window or another cabin." : "We’ll compare timing, route, cabin, baggage, and estimated exchange cost—not just the public fare."}</p>
    </section>
  );
}
