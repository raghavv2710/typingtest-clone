import { TypingTest } from "@/components/type-ace/typing-test";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-sans p-4 transition-colors duration-300">
      <main className="w-full max-w-4xl">
        <TypingTest />
      </main>
    </div>
  );
}
