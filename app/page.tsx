import { TypingTest } from "@/components/typing-engine/TypingTest";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <h1 className="sr-only">SpeedType — typing speed test</h1>
      <TypingTest />
    </main>
  );
}
