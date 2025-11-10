"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Target, AlertTriangle, RefreshCw } from "lucide-react";

type ResultsProps = {
  stats: {
    wpm: number;
    accuracy: number;
    errors: number;
  };
  restartTest: () => void;
};

export function Results({ stats, restartTest }: ResultsProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-2xl shadow-lg animate-in fade-in-50 zoom-in-95 duration-500 bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Your Test Score</CardTitle>
          <CardDescription>Here's your performance summary.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center items-center gap-8">
            {/* WPM */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full flex flex-col justify-center items-center font-bold text-3xl border-4 border-[color:var(--primary)] text-[color:var(--primary-foreground)]">
                <span>{stats.wpm}</span>
                <span className="text-xs font-semibold mt-1 opacity-80">WPM</span>
              </div>
              <p className="text-sm mt-3 opacity-90">Typing Speed</p>
            </div>

            <div className="text-4xl font-bold opacity-90">×</div>

            {/* Accuracy */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full flex flex-col justify-center items-center font-bold text-3xl border-4 border-emerald-400 text-emerald-300">
                <span>{stats.accuracy}%</span>
                <span className="text-xs font-semibold mt-1 opacity-80">{stats.errors} typos</span>
              </div>
              <p className="text-sm mt-3 opacity-90">Accuracy</p>
            </div>

            <div className="text-4xl font-bold opacity-90">=</div>

            {/* Net */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full flex flex-col justify-center items-center font-bold text-3xl border-4 border-[color:var(--accent)] text-[color:var(--accent)]">
                <span>{Math.max(0, Math.round(stats.wpm * (stats.accuracy / 100)))}</span>
                <span className="text-xs font-semibold mt-1 opacity-80">WPM</span>
              </div>
              <p className="text-sm mt-3 opacity-90">Net Speed</p>
            </div>
          </div>

          {/* Chart area (visual placeholder like your screenshot) */}
          <div className="w-full max-w-xl mx-auto mt-6 p-6 rounded-xl bg-background/30 relative">
            <div className="flex justify-between items-end h-40 relative">
              <div className="flex flex-col items-center">
                <div className="w-10 bg-gray-400 rounded-t-md" style={{ height: "70px" }} />
                <p className="text-xs mt-2 opacity-80">Average</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 bg-cyan-400 rounded-t-md" style={{ height: "65px" }} />
                <p className="text-xs mt-2 opacity-80">Nov 08</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 bg-cyan-300 rounded-t-md" style={{ height: "60px" }} />
                <p className="text-xs mt-2 opacity-80">12:18 am</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 bg-cyan-200 rounded-t-md relative" style={{ height: "70px" }}>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg">👑</span>
                </div>
                <p className="text-xs mt-2 opacity-80">12:20 am</p>
              </div>
            </div>

            <div className="absolute left-6 top-0 flex flex-col justify-between h-40 text-xs opacity-70">
              <span>Fast</span>
              <span>Fluent</span>
              <span>Average</span>
              <span>Slow</span>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={restartTest} variant="default" className="px-6 py-3">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
