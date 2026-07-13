"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MatchTimerProps {
  startedAt?: string;
  status: string;
  className?: string;
}

export function MatchTimer({ startedAt, status, className }: MatchTimerProps) {
  const [elapsed, setElapsed] = useState<string>("");

  useEffect(() => {
    if (status !== 'live' || !startedAt) return;

    const calculateElapsed = () => {
      const start = new Date(startedAt).getTime();
      const now = new Date().getTime();
      const diffInSeconds = Math.floor((now - start) / 1000);

      if (diffInSeconds < 0) {
        setElapsed("00:00");
        return;
      }

      const minutes = Math.floor(diffInSeconds / 60);
      const seconds = diffInSeconds % 60;

      setElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    // Premier calcul différé (pas de setState synchrone dans l'effet)
    const kickoff = setTimeout(calculateElapsed, 0);
    const interval = setInterval(calculateElapsed, 1000);

    return () => { clearTimeout(kickoff); clearInterval(interval); };
  }, [startedAt, status]);

  if (status !== 'live' || !elapsed) return null;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <span className="font-black font-mono tabular-nums text-primary">
        {elapsed}’
      </span>
    </div>
  );
}
