import { Header } from "./components/Header";
import { SearchBox } from "./components/SearchBox";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <Header />
      <section className="flex-1 flex flex-col justify-center gap-7 max-w-[1040px] w-full mx-auto px-6 pb-16 sm:px-10 lg:px-20 lg:pb-20">
        <h1 className="font-serif font-normal text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.02] tracking-[-1px] text-center">
          What are you <em className="text-accent">in the mood</em> to read?
        </h1>
        <p className="-mt-2 lg:-mt-3 text-lg leading-[1.5] text-text-muted text-center">
          Describe a feeling, and we&apos;ll match you with books by tone, pacing, and themes, not
          just genre.
        </p>

        <SearchBox />
      </section>
    </div>
  );
}
