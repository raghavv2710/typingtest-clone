"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { textSamples } from '@/lib/typing-data';
import { Results } from './results';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XCircle, RefreshCw } from 'lucide-react';

type Duration = 30 | 60 | 120;
type Difficulty = 'easy' | 'medium' | 'hard';

const LINE_HEIGHT_EM = 3; 

export function TypingTest() {
  const [testId, setTestId] = useState(0);
  const [duration, setDuration] = useState<Duration>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const [textToType, setTextToType] = useState('');
  const [words, setWords] = useState<string[]>([]);
  
  const [typedText, setTypedText] = useState('');
  const [status, setStatus] = useState<'waiting' | 'running' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(duration);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, errors: 0 });

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateNewTest = useCallback(() => {
    const samplesForDifficulty = textSamples[difficulty];
    const randomIndex = Math.floor(Math.random() * samplesForDifficulty.length);
    const newText = samplesForDifficulty[randomIndex];
    setTextToType(newText);
    setWords(newText.split(' '));
  }, [difficulty]);

  useEffect(() => {
    generateNewTest();
    setTestId(prev => prev + 1);
  }, [difficulty, generateNewTest]);
  
  const restartTest = useCallback(() => {
    setStatus('waiting');
    setTypedText('');
    setCurrentWordIndex(0);
    setCompletedLines(0);
    setTimeLeft(duration);
    setStats({ wpm: 0, accuracy: 100, errors: 0 });

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (textContainerRef.current) {
        textContainerRef.current.style.transform = `translateY(0px)`;
    }
    
    generateNewTest();
    setTestId(prev => prev + 1);

    inputRef.current?.focus();
  }, [duration, generateNewTest]);
  
  useEffect(() => {
    restartTest();
  }, [duration, difficulty]);


  const calculateStats = useCallback(() => {
    const typedWords = typedText.trim().split(' ');
    let correctChars = 0;
    let totalTypedChars = 0;
    
    typedWords.forEach((typedWord, i) => {
        if (i >= words.length) return;
        const originalWord = words[i];
        if (typedWord === originalWord) {
            correctChars += originalWord.length + 1; // +1 for space
        }
        totalTypedChars += typedWord.length + 1;
    });

    const elapsedTimeInMinutes = (duration - timeLeft) / 60;
    const wpm = elapsedTimeInMinutes > 0 ? (correctChars / 5) / elapsedTimeInMinutes : 0;
    
    const correctWordsCount = typedWords.filter((word, index) => index < words.length && word === words[index]).length;
    const typedWordCount = Math.min(typedWords.length, words.length);
    const accuracy = typedWordCount > 0 ? (correctWordsCount / typedWordCount) * 100 : 100;

    setStats({
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy),
        errors: typedWordCount - correctWordsCount,
    });
  }, [typedText, words, duration, timeLeft]);

  useEffect(() => {
    if (status === 'running') {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              setStatus('finished');
              calculateStats();
              return 0;
            }
            calculateStats();
            return prevTime - 1;
          });
        }, 1000);
      }
    } else if (status === 'finished') {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [status, calculateStats]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (status === 'finished') return;
    
    if (status === 'waiting' && value.trim().length > 0) {
      setStatus('running');
    }

    setTypedText(value);

    const newCurrentWordIndex = value.trim().split(' ').length - 1;
    if (value.endsWith(' ')) {
      setCurrentWordIndex(newCurrentWordIndex + 1);
    } else {
      setCurrentWordIndex(newCurrentWordIndex);
    }
  };

  useEffect(() => {
    if (textContainerRef.current) {
      const currentWordElement = textContainerRef.current.querySelector(`.word.word-${currentWordIndex}`) as HTMLElement;
      if (currentWordElement) {
        const lineIndex = Math.floor(currentWordElement.offsetTop / (LINE_HEIGHT_EM * 16)); // Assumes 1em = 16px
        if (lineIndex > completedLines) {
           setCompletedLines(lineIndex);
        }
      }
    }
  }, [currentWordIndex, completedLines]);

  useEffect(() => {
    if (textContainerRef.current) {
      const scrollAmount = -completedLines * LINE_HEIGHT_EM;
      textContainerRef.current.style.transform = `translateY(${scrollAmount}em)`;
    }
  }, [completedLines]);
  
  if (status === 'finished') {
    return <Results stats={stats} restartTest={restartTest} />;
  }

  const typedWords = typedText.split(' ');
  const currentTypedWord = typedWords[currentWordIndex] || '';

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-4xl p-6 rounded-lg bg-card border border-border shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <Select value={String(duration)} onValueChange={(val) => setDuration(Number(val) as Duration)}>
                    <SelectTrigger className="w-[100px] h-9 text-sm">
                        <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30">30s</SelectItem>
                        <SelectItem value="60">1m</SelectItem>
                        <SelectItem value="120">2m</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty)}>
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
            <div className="flex items-center gap-2 text-2xl font-mono text-primary">
                <span>{timeLeft}</span>
            </div>
            <Button onClick={restartTest} variant="ghost" size="icon">
                <RefreshCw className="h-5 w-5" />
            </Button>
        </div>

        <div id="text-container" className="relative text-2xl leading-relaxed font-mono h-[9em] overflow-hidden select-none">
            <div ref={textContainerRef} className="absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out">
                {words.map((word, index) => {
                    const isCurrentWord = index === currentWordIndex;
                    const isTypedWord = index < currentWordIndex;

                    return (
                        <span key={index} className={`word word-${index} ${isCurrentWord ? 'current-word' : ''} ${isTypedWord ? (typedWords[index] === word ? 'correct' : 'incorrect') : ''}`}>
                            {word}
                        </span>
                    );
                }).reduce((prev, curr, i) => [prev, ' ', curr], [] as any)}
            </div>
        </div>
      </div>
      
      <div className="w-full max-w-4xl h-16">
        <input
            id="text-input"
            ref={inputRef}
            type="text"
            className="w-full h-full text-2xl p-4 bg-card border border-border rounded-lg font-mono outline-none focus:ring-2 focus:ring-primary"
            value={typedText}
            onChange={handleInputChange}
            onPaste={(e) => e.preventDefault()}
            disabled={status === 'finished'}
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