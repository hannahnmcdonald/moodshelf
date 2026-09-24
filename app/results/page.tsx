import { Header } from "../components/Header";

export default async function Results({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="flex flex-col flex-1">
      <Header />
      <section className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl">Results screen coming in a later phase</p>
        {q && <p className="text-text-muted">Searched for: &ldquo;{q}&rdquo;</p>}
      </section>
    </div>
  );
}
