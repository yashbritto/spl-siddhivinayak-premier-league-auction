import { useEffect, useRef, useState } from "react";

interface AuctionTimerProps {
  currentBid: number;
  isActive: boolean;
  onExpire?: () => void;
  size?: "sm" | "lg";
}

export function AuctionTimer({
  currentBid,
  isActive,
  onExpire,
  size = "lg",
}: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const prevBidRef = useRef(currentBid);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isGoing, setIsGoing] = useState(false);

  // Reset timer when bid changes
  useEffect(() => {
    if (currentBid !== prevBidRef.current) {
      prevBidRef.current = currentBid;
      setTimeLeft(10);
      setIsGoing(false);
    }
  }, [currentBid]);

  // Countdown interval
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTimeLeft(10);
      setIsGoing(false);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGoing(true);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, onExpire]);

  const circumference = 283; // 2 * pi * 45
  const progress = timeLeft / 10;
  const dashOffset = circumference * (1 - progress);

  const isUrgent = timeLeft <= 3 && timeLeft > 0;

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 font-digital text-xs flex items-center justify-center"
          style={{
            color: isUrgent ? "oklch(0.62 0.22 25)" : "oklch(0.78 0.165 85)",
          }}
        >
          {timeLeft}s
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg
          className="w-24 h-24 -rotate-90"
          viewBox="0 0 100 100"
          aria-label="Auction countdown timer"
        >
          <title>Auction countdown timer</title>
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="oklch(0.22 0.04 265)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isUrgent ? "oklch(0.62 0.22 25)" : "oklch(0.78 0.165 85)"}
            strokeWidth="6"
            strokeLinecap="square"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.9s linear, stroke 0.3s ease",
              filter: isUrgent
                ? "drop-shadow(0 0 8px oklch(0.62 0.22 25 / 0.8))"
                : "drop-shadow(0 0 8px oklch(0.78 0.165 85 / 0.6))",
            }}
          />
        </svg>
        {/* Center time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-digital text-2xl font-bold leading-none"
            style={{
              color: isUrgent ? "oklch(0.62 0.22 25)" : "oklch(0.78 0.165 85)",
            }}
          >
            {String(timeLeft).padStart(2, "0")}
          </span>
          <span
            className="text-xs tracking-widest"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            SEC
          </span>
        </div>
      </div>
      {isGoing && (
        <div
          className="text-xs font-broadcast tracking-widest animate-pulse"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          GOING... GOING...
        </div>
      )}
    </div>
  );
}
