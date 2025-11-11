"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { textSamples } from "@/lib/typing-data";
import { Results } from "./results";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Sun, Moon } from "lucide-react";

type Duration = 30 | 60 | 120;
type Difficulty = "easy" | "medium" | "hard";

const STATS_UPDATE_INTERVAL = 300; // ms

export function TypingTest() {
  const [duration, setDuration] = useState<Duration>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [textToType, setTextToType] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [typedText, setTypedText] = useState("");

  const [status, setStatus] = useState<"waiting" | "running" | "finished">("waiting");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, errors: 0 });

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState(0);

  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Theme persistence ---
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme-mode");
    const isDark = saved !== "light";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme-mode", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme-mode", "light");
      }
      return next;
    });
  };

  // --- Generate new test text ---
  const generateNewTest = useCallback(() => {
    const difficultyKey = difficulty as keyof typeof textSamples;
    const samplesForDifficulty = textSamples[difficultyKey] || textSamples.easy;
    const idx = Math.floor(Math.random() * samplesForDifficulty.length);
    const sample = samplesForDifficulty[idx];
    const text = typeof sample === "string" ? sample : sample.text;
    setTextToType(text);
    setWords(text.split(" ").filter(Boolean));
  }, [difficulty]);

  useEffect(() => {
    generateNewTest();
  }, [generateNewTest]);
  
  // --- Restart test ---
  const restartTest = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("waiting");
    setTypedText("");
    setCurrentWordIndex(0);
    setCompletedLines(0);
    setTimeLeft(duration);
    setStats({ wpm: 0, accuracy: 100, errors: 0 });
    startTimeRef.current = null;
    generateNewTest();
    inputRef.current?.focus();
  }, [duration, generateNewTest]);
  
  useEffect(() => {
    // Reset the test when duration changes
    restartTest();
  }, [duration, difficulty, restartTest]);

  // --- Calculate stats ---
  const calculateStats = useCallback(() => {
    const elapsed = startTimeRef.current
      ? (Date.now() - startTimeRef.current) / 1000
      : 0;
    if (elapsed === 0) {
      return { wpm: 0, accuracy: 100, errors: 0 };
    }
  
    const typedWordsArray = typedText.trim().split(/\s+/).filter(Boolean);
    let correctChars = 0;
    let errors = 0;
  
    typedWordsArray.forEach((typedWord, i) => {
      const originalWord = words[i];
      if (!originalWord) return;
  
      if (typedWord === originalWord) {
        correctChars += originalWord.length + 1; // +1 for the space
      } else {
        // Count character-level errors for more accurate WPM
        for (let j = 0; j < typedWord.length; j++) {
          if (typedWord[j] !== originalWord[j]) {
            errors++;
          }
        }
      }
    });
  
    const wpm = (correctChars / 5) / (elapsed / 60);
    const totalWordsTyped = Math.max(1, typedWordsArray.length);
    const correctWordsCount = typedWordsArray.filter((word, i) => word === words[i]).length;
    const accuracy = (correctWordsCount / totalWordsTyped) * 100;
  
    return {
      wpm: Math.round(wpm > 0 ? wpm : 0),
      accuracy: Math.round(accuracy >= 0 ? accuracy : 0),
      errors: errors,
    };
  }, [typedText, words]);
  

  // --- Smooth requestAnimationFrame timer ---
  useEffect(() => {
    if (status !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (!startTimeRef.current) startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current!) / 1000;
      const newTimeLeft = Math.max(0, duration - elapsed);
      setTimeLeft(newTimeLeft);
      
      const currentStats = calculateStats();
      setStats(currentStats);

      if (newTimeLeft <= 0) {
        if(intervalRef.current) clearInterval(intervalRef.current)
        setStatus("finished");
        // Final calculation
        const finalStats = calculateStats();
        setStats(finalStats);
      }
    }, 100); // Update more frequently for smoother stats

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, duration, calculateStats]);


  // --- Handle typing input ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (status === "finished") return;

    if (status === "waiting" && value.length > 0) {
      setStatus("running");
      startTimeRef.current = startTimeRef.current ?? Date.now();
    }

    setTypedText(value);

    // This logic handles incorrect words
    const typedWords = value.trim().split(/\s+/);
    const currentTypedWord = typedWords[typedWords.length - 1];
    const currentOriginalWord = words[typedWords.length - 1];

    if (value.endsWith(' ') || currentTypedWord !== currentOriginalWord?.substring(0, currentTypedWord.length)) {
       // Mark errors immediately for feedback, but accuracy calc is separate
    }

    const wordCount = value.trim().split(/\s+/).length;
    setCurrentWordIndex(value.endsWith(" ") ? wordCount : wordCount - 1);
  };

  // --- Scroll effect ---
  useEffect(() => {
    if (!textContainerRef.current) return;
    const el = textContainerRef.current.querySelector(`.word.word-${currentWordIndex}`) as HTMLElement | null;
    if (el) {
      // Simple scroll into view logic
      const containerRect = textContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (elRect.bottom > containerRect.bottom || elRect.top < containerRect.top) {
         const lineIndex = Math.floor((el.offsetTop - textContainerRef.current.offsetTop) / el.offsetHeight);
         if (lineIndex > completedLines) {
           setCompletedLines(lineIndex);
         }
      }
    }
  }, [currentWordIndex, completedLines]);

  useEffect(() => {
    if (!textContainerRef.current) return;
    // Each line has a height of roughly 3rem (2xl text + line-height)
    const scrollAmount = -completedLines * 3;
    textContainerRef.current.style.transform = `translateY(${scrollAmount}rem)`;
  }, [completedLines]);

  const wordSpans = words.map((w, i) => {
    const typedWords = typedText.trim().split(/\s+/);
    const isCurrent = i === currentWordIndex;
    const isTyped = i < currentWordIndex;
    let cls = "text-muted-foreground";

    if (isCurrent) {
        cls = "current-word";
    } else if(isTyped) {
        cls = typedWords[i] === w ? "correct" : "incorrect";
    }

    return (
      <span key={i} className={`word word-${i} ${cls}`}>
        {w}
      </span>
    );
  });

  if (status === "finished") {
    return <Results stats={stats} restartTest={restartTest} />;
  }

  if (!mounted) return <p className="text-center text-muted-foreground mt-10">Loading...</p>;

  return (
    <div className="w-full flex flex-col items-center gap-8 transition-colors duration-300">
      <div className="w-full max-w-4xl p-6 rounded-lg bg-card border border-border shadow-lg relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v) as Duration)}>
              <SelectTrigger className="w-[120px] h-9 text-sm">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30s</SelectItem>
                <SelectItem value="60">1m</SelectItem>
                <SelectItem value="120">2m</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger className="w-[120px] h-9 text-sm capitalize">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-3xl font-mono timer">
              <span>{Math.ceil(timeLeft)}s</span>
            </div>
            
            <Button onClick={toggleTheme} variant="ghost" size="icon" className="transition-transform hover:scale-110">
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-400 transition-all duration-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700 transition-all duration-300" />
              )}
            </Button>

            <Button onClick={restartTest} variant="ghost" size="icon">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          id="text-container"
          className="relative text-2xl leading-relaxed font-mono h-[9rem] overflow-hidden select-none"
        >
          <div
            ref={textContainerRef}
            className="absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out"
          >
            {wordSpans}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl h-16 mt-4">
        <input
          ref={inputRef}
          type="text"
          className="w-full h-full text-2xl p-4 bg-card border border-border rounded-lg font-mono outline-none focus:ring-2 focus:ring-ring"
          value={typedText}
          onChange={handleInputChange}
          onPaste={(e) => e.preventDefault()}
          disabled={status === "finished"}
          autoFocus
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
