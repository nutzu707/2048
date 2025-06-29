"use client";

import Hello2048 from "./components/2048";
import React, { useEffect, useRef } from "react";

export default function Home() {
  const gradientRef = useRef<HTMLDivElement>(null);
// Features you could implement for your 2048 game:
//
// 1. **Undo Move**: Allow the player to undo their last move.
// 2. **Tile Animation**: Animate tile movement and merging for a smoother experience.
// 3. **Custom Grid Size**: Let users choose different grid sizes (e.g., 5x5, 6x6).
// 4. **Leaderboard**: Store and display a leaderboard of high scores (locally or online).
// 5. **Dark Mode**: Add a toggle for dark/light theme.
// 6. **Touch Controls**: Add swipe support for mobile/touch devices.
// 7. **Sound Effects**: Play sounds on moves, merges, win, and game over.
// 8. **Challenge Modes**: Add timed mode, limited moves, or other challenges.
// 9. **Persistent State**: Save and restore the current game state on reload.
// 10. **Share Score**: Allow users to share their score on social media.
// 11. **AI Solver**: Add a button to let an AI play or suggest the next move.
// 12. **Custom Starting Tiles**: Let users set the number or value of starting tiles.
// 13. **Colorblind Accessibility**: Offer colorblind-friendly tile palettes.
// 14. **Statistics**: Show stats like best tile, average score, moves per game, etc.
// 15. **Keyboard Remapping**: Allow users to customize control keys.
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
