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

export function TypingTest() {
  // UI controls
  const [duration, setDuration] = useState<Duration>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Test state
  const [textToType, setTextToType] = useState<string>("");
  const [words, setWords] = useState<string[]>([]);
  const [typedText, setTypedText] = useState<string>("");

  const [status, setStatus] = useState<"waiting" | "running" | "finished">(
    "waiting"
  );
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, errors: 0 });

  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [completedLines, setCompletedLines] = useState<number>(0);

  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Theme initialization (hydration-safe) ---
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ta-dark");
    const enabled = saved === "1" || saved === null; // default dark
    setDarkMode(enabled);
    if (enabled) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("ta-dark", next ? "1" : "0");
      return next;
    });
  };

  // generate new test text
  const generateNewTest = useCallback(() => {
    const difficultyKey = difficulty as keyof typeof textSamples;
    const samplesForDifficulty = textSamples[difficultyKey];
    
    if (!samplesForDifficulty || samplesForDifficulty.length === 0) {
      setTextToType("Loading sample...");
      setWords(["Loading", "sample..."]);
      return;
    }

    const idx = Math.floor(Math.random() * samplesForDifficulty.length);
    const sample = samplesForDifficulty[idx];
    const text = typeof sample === 'string' ? sample : sample.text;
    setTextToType(text);
    const wordArr = text.split(" ").filter(Boolean);
    setWords(wordArr);
  }, [difficulty]);

  // initial generation
  useEffect(() => {
    generateNewTest();
  }, [generateNewTest, difficulty]);

  // restart
  const restartTest = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setStatus("waiting");
    setTypedText("");
    setCurrentWordIndex(0);
    setCompletedLines(0);
    setTimeLeft(duration);
    setStats({ wpm: 0, accuracy: 100, errors: 0 });

    if (textContainerRef.current) {
      textContainerRef.current.style.transform = `translateY(0px)`;
    }

    generateNewTest();
    inputRef.current?.focus();
  }, [duration, generateNewTest]);

  useEffect(() => {
    restartTest();
  }, [duration, difficulty, restartTest]);

  const calculateStats = useCallback(() => {
    const typedWords = typedText.trim().length > 0 ? typedText.trim().split(/\s+/) : [];
    let correctChars = 0;
    let correctWordsCount = 0;

    typedWords.forEach((typedWord, i) => {
      if (i < words.length) {
        const originalWord = words[i];
        if (typedWord === originalWord) {
          correctWordsCount++;
          correctChars += originalWord.length + 1; // +1 for the space
        }
      }
    });

    const elapsed = Math.max(0, duration - timeLeft);
    const elapsedMinutes = elapsed / 60;
    const wpm = elapsedMinutes > 0 ? (correctChars / 5) / elapsedMinutes : 0;
    
    const accuracy = typedWords.length > 0 ? (correctWordsCount / typedWords.length) * 100 : 100;
    const errors = typedWords.length - correctWordsCount;

    setStats({
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      errors: errors,
    });
  }, [typedText, words, duration, timeLeft]);

  // Game loop
  useEffect(() => {
    if (status === "running") {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setStatus("finished");
            calculateStats();
            return 0;
          }
          return prevTime - 1;
        });
        calculateStats();
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status, duration, calculateStats]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (status === "finished") return;

    if (status === "waiting" && value.length > 0) {
      setStatus("running");
    }

    setTypedText(value);

    const typedWords = value.trim().split(/\s+/);
    let currentWordIdx = typedWords.length - 1;
    if (value.endsWith(" ")) {
      currentWordIdx++;
    }
    setCurrentWordIndex(currentWordIdx);

    if(typedWords.length >= words.length && value.endsWith(" ")) {
      setStatus("finished");
      calculateStats();
    }
  };

  useEffect(() => {
    if (!textContainerRef.current) return;
    const el = textContainerRef.current.querySelector(`.word.word-${currentWordIndex}`) as HTMLElement | null;
    if (el) {
      const lineIndex = Math.floor(el.offsetTop / (3 * 16)); // Assuming line-height is 3rem
      if (lineIndex > completedLines) {
        setCompletedLines(lineIndex);
      }
    }
  }, [currentWordIndex, completedLines]);

  useEffect(() => {
    if (!textContainerRef.current) return;
    const scrollAmount = -completedLines * 3; // 3rem per line
    textContainerRef.current.style.transform = `translateY(${scrollAmount}rem)`;
  }, [completedLines]);

  const wordSpans =
    words.length === 0
      ? [<span key="loading" className="word">Loading sample...</span>]
      : words.map((w, i) => {
          const isCurrent = i === currentWordIndex;
          let wordClass = "text-muted-foreground";

          if(isCurrent) {
            wordClass = "current-word";
          }
          
          return (
            <span key={i} className={`word word-${i} ${wordClass}`}>
              {w}
            </span>
          );
        });

  if (status === "finished") {
    return <Results stats={stats} restartTest={restartTest} />;
  }

  if (!mounted) {
    return <div className="text-muted-foreground text-center mt-10 animate-pulse">Loading Typing Test...</div>;
  }

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-4xl p-6 rounded-lg bg-card border border-border shadow-lg relative">
        <div className="absolute top-4 right-4">
          <Button onClick={toggleTheme} variant="ghost" size="icon">
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700" />
            )}
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Select
              value={String(duration)}
              onValueChange={(val) => setDuration(Number(val) as Duration)}
            >
              <SelectTrigger className="w-[120px] h-9 text-sm">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="120">2 minutes</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={difficulty}
              onValueChange={(val) => setDifficulty(val as Difficulty)}
            >
              <SelectTrigger className="w-[120px] h-9 text-sm">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-3xl font-mono timer-blue">
            <span>{Math.ceil(timeLeft)}</span>
          </div>

          <Button onClick={restartTest} variant="ghost" size="icon">
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        <div
          id="text-container"
          className="relative text-2xl leading-relaxed font-mono h-[9em] overflow-hidden select-none"
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
          id="text-input"
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
