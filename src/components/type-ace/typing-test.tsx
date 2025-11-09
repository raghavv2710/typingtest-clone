"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { textSamples } from '@/lib/typing-data';
import { Results } from './results';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

type Mode = 'normal' | 'pro';
type Duration = 30 | 60 | 120;
type Difficulty = 'easy' | 'medium' | 'hard';

const LINE_HEIGHT = 48; // Corresponds to h-12

export function TypingTest() {
  const [testId, setTestId] = useState(0);
  const [mode, setMode] = useState<Mode>('normal');
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
    const key = `${difficulty}-${testId % 4}`;
    return textSamples[key as keyof typeof textSamples] || textSamples['easy-0'];
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
    setTestId(prev => prev + 1); // Get new text
    inputRef.current?.focus();
  }, [duration]);

  const calculateStats = useCallback(() => {
    if (!startTimeRef.current || status !== 'running') return;

    const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
    const correctlyTypedChars = typedText.split(' ').slice(0, currentWordIndex).join(' ').length;
    
    const wordsTyped = correctlyTypedChars / 5;
    const wpm = elapsedTime > 0 ? (wordsTyped / elapsedTime) * 60 : 0;
    
    const typedWords = typedText.split(' ');
    let errors = 0;
    for(let i = 0; i < currentWordIndex; i++) {
        if(typedWords[i] !== words[i]) {
            errors++;
        }
    }

    const accuracy = currentWordIndex > 0 ? ((currentWordIndex - errors) / currentWordIndex) * 100 : 100;

    setStats({
      wpm: Math.round(wpm),
      accuracy: Math.max(0, Math.round(accuracy)),
      errors,
    });
  }, [typedText, currentWordIndex, status, words]);

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
        timerIntervalRef.current = setInterval(() => {
          const elapsedTime = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000;
          const newTimeLeft = duration - elapsedTime;
          calculateStats();
          if (newTimeLeft <= 0) {
            setTimeLeft(0);
            endTest();
          } else {
            setTimeLeft(newTimeLeft);
          }
        }, 1000);
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
    closeTest();
  }, [mode, duration, difficulty]);


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (status === 'finished') return;
    if (status === 'waiting' && value.length > 0) {
      setStatus('running');
    }

    const currentTypedWord = value.split(' ').pop() || '';
    if (value.endsWith(' ')) {
      if(currentTypedWord === '') { // handles multiple spaces
        const currentLine = Math.floor(currentWordIndex / 10);
        setCurrentWordIndex(prev => prev + 1);
        if (mode === 'normal' && (currentWordIndex + 1) % 10 === 0 && currentWordIndex > 0) {
            const nextLine = completedLines + 1;
            setCompletedLines(nextLine);
            if(textContainerRef.current) {
                textContainerRef.current.style.transform = `translateY(-${nextLine * LINE_HEIGHT}px)`;
            }
        }
      }
    }
    
    setTypedText(value);
    setCurrentWordIndex(value.trim().split(' ').length - 1);
  };
  
  if (status === 'finished') {
    return <Results stats={stats} restartTest={closeTest} />;
  }

  const typedWords = typedText.split(' ');
  const currentWordInput = typedWords[typedWords.length - 1];

  return (
    <div className="w-full rounded-lg border-2 border-border bg-card shadow-lg p-4 font-mono text-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-foreground">{duration} Second Typing Test</h1>
      </div>

      <div className="bg-background/50 p-4 rounded-md border border-border/50">
        <div className="flex items-center justify-between text-sm mb-4 text-foreground/80">
          <div className="flex items-center gap-4">
            <span>{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}</span>
            <span className="text-foreground/50">MODE</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant={mode === 'normal' ? 'default' : 'ghost'} onClick={() => setMode('normal')} className={cn("px-4 py-1 h-auto text-sm", {'bg-primary': mode === 'normal'})}>Normal</Button>
              <Button size="sm" variant={mode === 'pro' ? 'default' : 'ghost'} onClick={() => setMode('pro')} className={cn("px-4 py-1 h-auto text-sm", {'bg-primary': mode === 'pro'})}>Pro</Button>
            </div>
          </div>
          <button onClick={closeTest} className="flex items-center gap-1 text-foreground/80 hover:text-foreground">
            CLOSE <XCircle size={16} />
          </button>
        </div>

        <div className="relative h-36 overflow-hidden">
           <div ref={textContainerRef} className="absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out">
            {Array.from({ length: Math.ceil(words.length / 10) }).map((_, lineIndex) => (
              <div key={lineIndex} className="h-12 flex items-center border-b border-gray-600">
                <p>
                  {words.slice(lineIndex * 10, (lineIndex + 1) * 10).map((word, wordIndexInLine) => {
                    const wordIndex = lineIndex * 10 + wordIndexInLine;
                    const isCurrentWord = wordIndex === currentWordIndex;
                    const isTypedWord = wordIndex < currentWordIndex;
                    
                    return (
                      <span key={wordIndex} className={cn(
                        "text-foreground/60",
                        {
                          "text-accent": isCurrentWord,
                        }
                      )}>
                        {word}{' '}
                      </span>
                    );
                  })}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute top-0 left-0 w-full">
            {Array.from({ length: Math.ceil(words.length / 10) }).map((_, lineIndex) => {
                const lineStartIndex = lineIndex * 10;
                const lineEndIndex = lineStartIndex + 10;
                const wordsInLine = words.slice(lineStartIndex, lineEndIndex);
                const typedWordsOnThisLine = typedWords.slice(lineStartIndex, lineEndIndex);

                if (currentWordIndex < lineStartIndex || currentWordIndex >= lineEndIndex) {
                    return (
                        <div key={`typed-${lineIndex}`} className="h-12 flex items-center invisible">
                            <p>{typedWordsOnThisLine.join(' ')}</p>
                        </div>
                    );
                }
                
                return (
                  <div key={`typed-${lineIndex}`} className="h-12 flex items-center" style={{marginTop: lineIndex > 0 ? `${(lineIndex - completedLines) * LINE_HEIGHT}px` : `-${completedLines * LINE_HEIGHT}px`, visibility: 'hidden'}}>
                     <p>
                      {wordsInLine.map((word, wordIndexInLine) => {
                         const wordIndex = lineStartIndex + wordIndexInLine;
                         const isCurrentWord = wordIndex === currentWordIndex;

                         if (isCurrentWord) {
                             return <span key={`cursor-word-${wordIndex}`} className='relative'>
                                 <span className='invisible'>{word}</span>
                                 <span className="absolute left-0 top-0 text-foreground">{currentWordInput}</span>
                                 <span className="absolute -right-0.5 top-0 bottom-0 w-0.5 bg-accent animate-pulse" style={{left: `${currentWordInput.length}ch`}} />
                             </span>
                         }
                         if (wordIndex < currentWordIndex) {
                             return <span key={`typed-${wordIndex}`} className="text-foreground">{typedWords[wordIndex]}{' '}</span>;
                         }
                         return null;
                      }).filter(Boolean)}
                    </p>
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

      <div className="flex items-center justify-center gap-6 mt-4 text-sm text-foreground/80">
        <div className="flex items-center gap-2">
          <span>Time:</span>
          <Button size="sm" variant={duration === 30 ? 'secondary' : 'ghost'} onClick={() => setDuration(30)} className={cn("px-3 py-1 h-auto", {'bg-primary/20 text-primary-foreground': duration === 30})}>30s</Button>
          <Button size="sm" variant={duration === 60 ? 'secondary' : 'ghost'} onClick={() => setDuration(60)} className={cn("px-3 py-1 h-auto", {'bg-primary/20 text-primary-foreground': duration === 60})}>1m</Button>
          <Button size="sm" variant={duration === 120 ? 'secondary' : 'ghost'} onClick={() => setDuration(120)} className={cn("px-3 py-1 h-auto", {'bg-primary/20 text-primary-foreground': duration === 120})}>2m</Button>
        </div>
        <div className="flex items-center gap-2">
          <span>Difficulty:</span>
          <Button size="sm" variant={difficulty === 'easy' ? 'secondary' : 'ghost'} onClick={() => setDifficulty('easy')} className={cn("px-3 py-1 h-auto", {'bg-primary/20 text-primary-foreground': difficulty === 'easy'})}>Easy</Button>
          <Button size="sm" variant={difficulty === 'medium' ? 'secondary' : 'ghost'} onClick={() => setDifficulty('medium')} className={cn("px-3 py-1 h-auto", {'bg-primary/20 text-primary-foreground': difficulty === 'medium'})}>Medium</Button>
          <Button size="sm" variant={difficulty === 'hard' ? 'secondary' : 'ghost'} onClick={() => setDifficulty('hard')} className={cn("px-3 py-1 h-auto", {'bg-primary/20 text-primary-foreground': difficulty === 'hard'})}>Hard</Button>
        </div>
      </div>
    </div>
  );
}
