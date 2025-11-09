"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Target, AlertTriangle, RefreshCw } from 'lucide-react';

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
          <CardTitle className="text-3xl font-bold">Test Completed!</CardTitle>
          <CardDescription>Here's your performance summary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <Zap className="h-5 w-5" />
                <h3 className="text-sm font-medium">Speed (WPM)</h3>
              </div>
              <p className="text-5xl font-bold text-accent">{stats.wpm}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <Target className="h-5 w-5" />
                <h3 className="text-sm font-medium">Accuracy</h3>
              </div>
              <p className="text-5xl font-bold text-accent">{stats.accuracy}%</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-sm font-medium">Errors</h3>
              </div>
              <p className="text-5xl font-bold text-destructive">{stats.errors}</p>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={restartTest} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
