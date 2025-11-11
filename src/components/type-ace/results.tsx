"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Share2, TrendingUp } from "lucide-react";
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

  // Performance message (gamified, catchy)
  const level =
    netSpeed >= 90
      ? "🔥 Elite Typer"
      : netSpeed >= 70
      ? "⚡ Fast Fingers"
      : netSpeed >= 50
      ? "💪 Getting Stronger"
      : "✨ Warming Up";

  // Short, engaging copy based on performance
  const line =
    netSpeed >= 90
      ? "Unstoppable! You’re at the top of the leaderboard."
      : netSpeed >= 70
      ? "You’re quick! Just a few more rounds to hit elite speed."
      : netSpeed >= 50
      ? "Solid work! Keep the rhythm going."
      : "Everyone starts somewhere. Let’s level you up!";

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-3xl shadow-xl animate-in fade-in-50 zoom-in-95 duration-500 bg-card border-border">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold">{level}</CardTitle>
          <CardDescription className="text-base opacity-90">
            {line}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* --- Main Stats Section --- */}
          <div className="flex justify-center items-center gap-10 flex-wrap">
            {/* WPM */}
            <div className="flex flex-col items-center">
              <div
                className={`w-28 h-28 rounded-full flex flex-col justify-center items-center font-bold text-3xl border-4 border-primary ${
                  isDarkMode ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                <span>{stats.wpm}</span>
                <span className="text-xs font-semibold mt-1 opacity-80">WPM</span>
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

          {/* --- Gamified CTA Section --- */}
          <div className="text-center space-y-4 bg-background/40 p-6 rounded-lg border border-border">
            <p className="text-lg font-semibold opacity-90">
              {netSpeed > 0
                ? `🔥 You typed at ${netSpeed} WPM with ${stats.accuracy}% accuracy.`
                : "Ready to take the test again?"}
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">
              Beat your own record, climb the leaderboard, and prove your speed.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button
                size="lg"
                variant="default"
                className="px-6 py-3 flex items-center gap-2"
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=Just%20scored%20${netSpeed}%20WPM%20on%20Type%20Ace!%20Think%20you%20can%20beat%20me%3F%20https%3A%2F%2Ftypeace.app`,
                    "_blank"
                  )
                }
              >
                <Share2 className="h-5 w-5" /> Share My Score
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="px-6 py-3 flex items-center gap-2"
                onClick={() =>
                  window.open("https://typeace.app/improve", "_blank")
                }
              >
                <TrendingUp className="h-5 w-5" /> Level Up
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="px-6 py-3 flex items-center gap-2"
                onClick={restartTest}
              >
                <RefreshCw className="h-5 w-5" /> Play Again
              </Button>
            </div>
          </div>

          {/* --- Soft Follow-Up CTA (lead generation hook) --- */}
          <div className="text-center pt-2 text-sm text-muted-foreground">
            <p>
              💡 Join our free <span className="font-semibold text-primary">Type Ace Club</span> to unlock challenges, weekly contests, and rewards.
            </p>
            <Button
              size="sm"
              className="mt-3 px-5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() =>
                window.open("https://typeace.app/signup", "_blank")
              }
            >
              Join Now →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
