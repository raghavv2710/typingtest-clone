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
import { XCircle } from 'lucide-react';

type Duration = 30 | 60 | 120;
type Difficulty = 'easy' | 'medium' | 'hard';

const LINE_HEIGHT = 48; // Corresponds to h-12

export function TypingTest() {
  const [testId, setTestId] = useState(0);
  const [duration, setDuration] = useState<Duration>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const [typedText, setTypedText] = useState('');
  const [status, setStatus] = useState<'waiting' | 'running' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(duration);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, errors: 0 });

  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const textToType = useMemo(() => {
    const samplesForDifficulty = textSamples[difficulty];
    const randomIndex = testId % samplesForDifficulty.length;
    return samplesForDifficulty[randomIndex];
  }, [difficulty, testId]);

  const words = useMemo(() => textToType.split(' '), [textToType]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState(0);
  
  const closeTest = useCallback(() => {
    setStatus('waiting');
    setTypedText('');
    setTimeLeft(duration);
    setStats({ wpm: 0, accuracy: 100, errors: 0 });
    setCurrentWordIndex(0);
    setCompletedLines(0);
    if(textContainerRef.current) {
        textContainerRef.current.style.transform = `translateY(0px)`;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    startTimeRef.current = null;
    setTestId(Math.floor(Math.random() * 1000)); // Get new random text
    inputRef.current?.focus();
  }, [duration]);
  
  useEffect(() => {
    closeTest();
  }, [duration, difficulty]);

  const calculateStats = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
    
    let correctChars = 0;
    let errorCount = 0;
    const typedWords = typedText.trim().split(' ');
    const typedUpTo = Math.min(typedWords.length, words.length);

    for (let i = 0; i < typedUpTo; i++) {
        const originalWord = words[i];
        const typedWord = typedWords[i];

        if (i < currentWordIndex) { // Fully typed words
            if (originalWord === typedWord) {
                correctChars += originalWord.length + 1; // +1 for space
            } else {
                errorCount++;
            }
        }
    }
    
    const wpm = elapsedTime > 0 ? (correctChars / 5) / (elapsedTime / 60) : 0;
    const accuracy = currentWordIndex > 0 ? ((currentWordIndex - errorCount) / currentWordIndex) * 100 : 100;

    setStats({
      wpm: Math.round(wpm),
      accuracy: Math.max(0, Math.round(accuracy)),
      errors: errorCount,
    });
  }, [typedText, words, currentWordIndex, startTimeRef]);

  const endTest = useCallback(() => {
    setStatus('finished');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    calculateStats();
  }, [calculateStats]);
  
  useEffect(() => {
    if (status === 'running') {
      if (!timerIntervalRef.current) {
        startTimeRef.current = Date.now();
      }
      
      timerIntervalRef.current = setInterval(() => {
        const elapsedTime = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000;
        const newTimeLeft = Math.max(0, duration - elapsedTime);
        
        setTimeLeft(newTimeLeft);
        calculateStats();

        if (newTimeLeft <= 0) {
          endTest();
        }
      }, 100); // Update more frequently for smoother countdown
    } else {
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
  }, [status, duration, endTest, calculateStats]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (status === 'finished') return;
    if (status === 'waiting' && value.length > 0 && value.trim() !== '') {
      setStatus('running');
    }

    if (value.endsWith(' ')) {
      const newWordIndex = typedText.trim().split(' ').length;
      setCurrentWordIndex(newWordIndex);
      
      if (newWordIndex > 0 && newWordIndex % 10 === 0) {
          const nextLine = completedLines + 1;
          setCompletedLines(nextLine);
          if(textContainerRef.current) {
              textContainerRef.current.style.transform = `translateY(-${nextLine * LINE_HEIGHT}px)`;
          }
      }
    }
    
    setTypedText(value);
  };
  
  if (status === 'finished') {
    return <Results stats={stats} restartTest={closeTest} />;
  }

  const typedWords = typedText.split(' ');
  const currentWordInput = typedWords[typedWords.length - 1];

  return (
    <div className="w-full rounded-lg border-2 border-border bg-card shadow-lg p-4 font-mono text-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-foreground">Typing Test</h1>
      </div>

      <div className="bg-background/50 p-4 rounded-md border border-border/50">
        <div className="flex items-center justify-between text-sm mb-4 text-foreground/80">
          <div className="flex items-center gap-4">
            <span className="tabular-nums">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}</span>
            <span className="text-foreground/50">|</span>
             <div className="flex items-center gap-2">
                <span>Time:</span>
                <Select value={String(duration)} onValueChange={(val) => setDuration(Number(val) as Duration)}>
                    <SelectTrigger className="w-[80px] h-8 text-sm">
                        <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30">30s</SelectItem>
                        <SelectItem value="60">1m</SelectItem>
                        <SelectItem value="120">2m</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <span>Difficulty:</span>
                <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty)}>
                    <SelectTrigger className="w-[100px] h-8 text-sm capitalize">
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <button onClick={closeTest} className="flex items-center gap-1 text-foreground/80 hover:text-foreground">
            RESTART <XCircle size={16} />
          </button>
        </div>

        <div className="relative h-36 overflow-hidden">
           <div ref={textContainerRef} className="absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out">
            {Array.from({ length: Math.ceil(words.length / 10) }).map((_, lineIndex) => (
              <div key={lineIndex} className="h-12 flex items-center">
                <p>
                  {words.slice(lineIndex * 10, (lineIndex + 1) * 10).map((word, wordIndexInLine) => {
                    const wordIndex = lineIndex * 10 + wordIndexInLine;
                    const isCurrentWord = wordIndex === currentWordIndex;
                    
                    let charColor = "text-foreground/60";
                    if (wordIndex < currentWordIndex) {
                        if (typedWords[wordIndex] === word) {
                            charColor = "text-foreground/80";
                        } else {
                            // No red color for wrong words
                            charColor = "text-foreground/60"
                        }
                    } else if (isCurrentWord) {
                        charColor = "text-accent";
                    }

                    return (
                      <span key={wordIndex} className={charColor}>
                        {word.split('').map((char, charIndex) => {
                          const isTypedChar = wordIndex < currentWordIndex || (isCurrentWord && charIndex < currentWordInput.length);
                          
                          if (isCurrentWord) {
                            if (charIndex < currentWordInput.length) {
                                if (currentWordInput[charIndex] === char) {
                                    return <span key={charIndex} className="text-foreground/80">{char}</span>;
                                }
                                return <span key={charIndex} className="text-foreground/60">{char}</span>;
                            }
                          }
                          
                          if (isTypedChar) {
                            return <span key={charIndex} className={typedWords[wordIndex] === word ? "text-foreground/80" : "text-foreground/60"}>{char}</span>;
                          }

                          return <span key={charIndex}>{char}</span>;
                        })}
                        {' '}
                      </span>
                    );
                  })}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {Array.from({ length: Math.ceil(words.length / 10) }).map((_, lineIndex) => {
                const lineStartIndex = lineIndex * 10;
                const lineEndIndex = lineStartIndex + 10;

                if (currentWordIndex < lineStartIndex || currentWordIndex >= lineEndIndex) {
                  return null;
                }
                
                return (
                  <div key={`typed-overlay-${lineIndex}`} className="absolute top-0 left-0 w-full" style={{transform: `translateY(${(lineIndex - completedLines) * LINE_HEIGHT}px)`}}>
                     <div className="h-12 flex items-center">
                        <p>
                          {words.slice(lineStartIndex, lineEndIndex).map((word, wordIndexInLine) => {
                             const wordIndex = lineStartIndex + wordIndexInLine;

                             if (wordIndex < currentWordIndex) {
                               const typedWord = typedWords[wordIndex];
                               const isCorrect = typedWord === word;
                               return <span key={`typed-${wordIndex}`} className={cn(isCorrect ? "text-foreground/80" : "text-foreground/60")}>{typedWord}{' '}</span>;
                             }

                             if (wordIndex === currentWordIndex) {
                                 return <span key={`cursor-word-${wordIndex}`} className='relative'>
                                     <span className='invisible'>{word}</span>
                                     <span className="absolute left-0 top-0">
                                         {word.split('').map((char, charIndex) => {
                                             if (charIndex < currentWordInput.length) {
                                                 if (currentWordInput[charIndex] === char) {
                                                     return <span key={charIndex} className="text-foreground/80">{char}</span>
                                                 }
                                                 // Don't show red for incorrect chars
                                                 return <span key={charIndex} className="text-foreground/60">{char}</span>
                                             }
                                             return <span key={charIndex} className="text-accent">{char}</span>
                                         })}
                                     </span>
                                     <span className="absolute -right-0.5 top-0 bottom-0 w-0.5 bg-accent animate-pulse" style={{left: `${currentWordInput.length}ch`}} />
                                 </span>
                             }
                             return null;
                          }).filter(Boolean)}
                        </p>
                     </div>
                  </div>
                )
             })}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            className="absolute inset-0 w-full h-full bg-transparent border-none outline-none text-transparent caret-transparent p-0 m-0"
            value={typedText}
            onChange={handleInputChange}
            onPaste={(e) => e.preventDefault()}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            disabled={status === 'finished'}
          />
        </div>
      </div>
    </div>
  );
}
