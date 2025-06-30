"use client";

import Hello2048 from "./components/2048";
import React, { useEffect, useRef } from "react";

export default function Home() {
  const gradientRef = useRef<HTMLDivElement>(null);
// Features you could implement for your 2048 game:
//
// 8. **Challenge Modes**: Add timed mode, limited moves, or other challenges.
// 11. **AI Solver**: Add a button to let an AI play or suggest the next move.
// 14. **Statistics**: Show stats like best tile, average score, moves per game, etc.
//
// You can pick any of these to implement next!
  useEffect(() => {
    let angle = 45;
    let animationFrame: number;

    function animate() {
      angle = (angle + 0.1) % 360;
      if (gradientRef.current) {
        gradientRef.current.style.background = `linear-gradient(${angle}deg, #FEF08A, #FDBA74 50%, #F472B6 100%)`;
      }
      animationFrame = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div
      ref={gradientRef}
      className="flex justify-center items-center h-screen transition-colors duration-100"
      style={{
        background: "linear-gradient(45deg, #FEF08A, #FDBA74 50%, #F472B6 100%)",
      }}
    >
      <Hello2048 />
    </div>
  );
}
