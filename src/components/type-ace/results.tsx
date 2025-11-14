"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type ResultsProps = {
  stats: {
    wpm: number;
    accuracy: number;
    errors: number;
  };
  restartTest: () => void;
};

export function Results({ stats, restartTest }: ResultsProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const netSpeed = Math.max(0, Math.round(stats.wpm * (stats.accuracy / 100)));

  // Detect current theme
  useEffect(() => {
    const htmlClass = document.documentElement.classList;
    setIsDarkMode(htmlClass.contains("dark"));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-3xl shadow-xl animate-in fade-in-50 zoom-in-95 duration-500 bg-card border-border">
        
        {/* HEADER */}
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold">
            Results
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-10">

          {/* --- Main Stats --- */}
          <div className="flex justify-center items-center gap-10 flex-wrap">

            {/* WPM */}
            <div className="flex flex-col items-center">
              <div
                className={`w-28 h-28 rounded-full flex flex-col justify-center items-center font-bold text-3xl border-4 border-primary ${
                  isDarkMode ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                <span>{stats.wpm}</span>
                <span className="text-xs font-semibold mt-1 opacity-80">
                  WPM
                </span>
              </div>
              <p className="text-sm mt-3 opacity-90">Speed</p>
            </div>

            <div className="text-4xl font-bold opacity-90">×</div>

            {/* Accuracy */}
            <div className="flex flex-col items-center">
              <div
                className={`w-28 h-28 rounded-full flex flex-col justify-center items-center font-bold text-3xl border-4 border-emerald-400 ${
                  isDarkMode ? "text-emerald-300" : "text-emerald-600"
                }`}
              >
                <span>{stats.accuracy}%</span>
                <span className="text-xs font-semibold mt-1 opacity-80">
                  {stats.errors} typos
                </span>
              </div>
              <p className="text-sm mt-3 opacity-90">Accuracy</p>
            </div>

            <div className="text-4xl font-bold opacity-90">=</div>

            {/* Net Speed */}
            <div className="flex flex-col items-center">
              <div
                className={`w-28 h-28 rounded-full flex flex-col justify-center items-center font-bold text-3xl border-4 border-accent ${
                  isDarkMode ? "text-accent" : "text-primary"
                }`}
              >
                <span>{netSpeed}</span>
                <span className="text-xs font-semibold mt-1 opacity-80">
                  Net WPM
                </span>
              </div>
              <p className="text-sm mt-3 opacity-90">Final Score</p>
            </div>
          </div>

          {/* Play Again Only */}
          <div className="flex justify-center mt-6">
            <Button
              size="lg"
              variant="outline"
              className="px-6 py-3 flex items-center gap-2"
              onClick={restartTest}
            >
              <RefreshCw className="h-5 w-5" /> Play Again
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
