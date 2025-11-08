import { Keyboard } from 'lucide-react';
import { TypingTest } from '@/components/type-ace/typing-test';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Keyboard className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Type Ace</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
          <TypingTest />
        </div>
      </main>

      <footer className="py-6 md:px-6 md:py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Test your typing skills with Type Ace. Built for speed, accuracy, and fun.
          </p>
        </div>
      </footer>
    </div>
  );
}
