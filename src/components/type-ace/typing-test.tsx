
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { textSamples } from '@/lib/typing-data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Results } from './results';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Target, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TEST_DURATION = 31; // seconds

export function TypingTest() {
  const [activeText, setActiveText] = useState(textSamples[0]);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<'waiting' | 'running' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION - 1);
  
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, errors: 0 });
  const finalStats = useRef({ wpm: 0, accuracy: 100, errors: 0 });

  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const textToType = useMemo(() => activeText.text, [activeText]);
  const characters = useMemo(() => textToType.split(''), [textToType]);

  const calculateStats = useCallback(() => {
    if (!startTimeRef.current) return { wpm: 0, accuracy: 100, errors: 0 };
    
    const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
    const wpm = (typed.replace(/\s/g, '').length / 5) / (elapsedTime / 60);

    let currentErrors = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] !== textToType[i]) {
        currentErrors++;
      }
    }
    
    const accuracy = typed.length > 0 ? ((typed.length - currentErrors) / typed.length) * 100 : 100;
    
    return { 
      wpm: Math.round(wpm), 
      accuracy: Math.max(0, Math.round(accuracy)), 
      errors: currentErrors 
    };
  }, [typed, textToType]);


  const endTest = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setStatus('finished');
    finalStats.current = calculateStats();
  }, [calculateStats]);

  const restartTest = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTyped('');
    setStatus('waiting');
    setTimeLeft(TEST_DURATION - 1);
    setStats({ wpm: 0, accuracy: 100, errors: 0 });
    startTimeRef.current = null;
    const newText = textSamples.find(t => t.id === activeText.id);
    if (newText) {
      setActiveText(newText);
    }
    inputRef.current?.focus();
  }, [activeText.id]);

  useEffect(() => {
    if (status === 'running' && typed.length === textToType.length) {
      endTest();
    }
  }, [typed, textToType.length, status, endTest]);

  // Unified timer and stats effect
  useEffect(() => {
    if (status !== 'running') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    timerIntervalRef.current = setInterval(() => {
      const elapsedTime = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000;
      const newTimeLeft = Math.max(0, TEST_DURATION - 1 - Math.floor(elapsedTime));
      
      setTimeLeft(newTimeLeft);
      setStats(calculateStats());

      if (newTimeLeft <= 0) {
        endTest();
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, endTest, calculateStats]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'finished') return;

    if (status === 'waiting' && e.target.value.length > 0) {
      setStatus('running');
    }
    
    if (e.target.value.length <= textToType.length) {
      setTyped(e.target.value);
    }
  };

  const handleTextareaClick = () => {
    if (status !== 'finished') {
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);


  if (status === 'finished') {
    return <Results stats={finalStats.current} restartTest={restartTest} />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-xl font-bold">Typing Test</h2>
          <div className="w-48">
            <Select
              defaultValue={activeText.id}
              onValueChange={(value) => {
                const newText = textSamples.find(t => t.id === value);
                if (newText) {
                  setActiveText(newText);
                  restartTest();
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a text" />
              </SelectTrigger>
              <SelectContent>
                {textSamples.map(sample => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="relative text-2xl/relaxed md:text-3xl/relaxed tracking-wide font-mono p-4 sm:p-6 md:p-8 rounded-lg border bg-muted/30 cursor-text"
            onClick={handleTextareaClick}
          >
            {status === 'waiting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-lg z-10 pointer-events-none">
                <p className="text-lg text-muted-foreground animate-pulse">Click here and start typing to begin...</p>
              </div>
            )}
             <input
              ref={inputRef}
              type="text"
              className="absolute inset-0 w-full h-full p-4 sm:p-6 md:p-8 bg-transparent border-none outline-none text-transparent caret-transparent"
              value={typed}
              onChange={handleInputChange}
              onPaste={(e) => e.preventDefault()}
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            {characters.map((char, index) => {
              const isTyped = index < typed.length;
              const isCorrect = isTyped ? typed[index] === char : null;
              const isCurrent = index === typed.length;

              return (
                <span key={index} className="relative">
                  {isCurrent && (
                    <span className="absolute left-0 -top-1 -bottom-1 w-[2px] bg-primary animate-[pulse_0.7s_infinite] rounded-full" />
                  )}
                  <span
                    className={cn({
                      'text-muted-foreground': !isTyped,
                      'text-foreground': isTyped && isCorrect,
                      'text-destructive': isTyped && !isCorrect,
                      'bg-destructive/10': isTyped && !isCorrect,
                    })}
                  >
                    {char === ' ' && isTyped && !isCorrect ? '·' : char}
                  </span>
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{timeLeft}s</span>
                </div>
                <Progress value={((TEST_DURATION - 1) - timeLeft) / (TEST_DURATION-1) * 100} className="w-48 h-2" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-muted-foreground">WPM</div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{stats.wpm}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-muted-foreground">Accuracy</div>
                  <div className="flex items-center gap-1">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{stats.accuracy}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Button size="lg" onClick={restartTest} variant="outline" className="w-full">
          Restart Test
        </Button>
      </div>

    </div>
  );
}
