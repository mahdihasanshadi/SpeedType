import { TypingTest } from "@/components/typing-engine/TypingTest";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center pt-12 sm:pt-16">
      {/* No justify-center: re-centering would shift this block once Results grows the height. */}
      <h1 className="sr-only">SpeedType — typing speed test</h1>
      <TypingTest />
    </main>
  );
}
