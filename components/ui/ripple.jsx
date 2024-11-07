import React from "react";
import { cn } from "@/lib/utils";

const Ripple = React.memo(function Ripple({
  mainCircleSize = 50, // Starting size for mobile
  mainCircleOpacity = 0.24,
  numCircles = 10,
  className
}) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none fixed inset-0 overflow-hidden",
        className
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        // Adjust circle size for different screen sizes
        const size = mainCircleSize + i * 20; // Mobile circle size increments
        const desktopSize = (mainCircleSize * 0.5) + i * 10; // Smaller increments for desktop
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? "dashed" : "solid";
        const borderOpacity = 5 + i * 5;

        return (
          <div
            key={i}
            className="absolute animate-ripple rounded-full bg-foreground/25 shadow-xl border"
            style={{
              width: `min(${size}vw, ${desktopSize}vh)`, // Responsive sizing for mobile and desktop
              height: `min(${size}vw, ${desktopSize}vh)`,
              opacity,
              animationDelay,
              borderStyle,
              borderWidth: "1px",
              borderColor: `hsl(var(--foreground), ${borderOpacity / 100})`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) scale(1)"
            }}
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";

export default Ripple;
