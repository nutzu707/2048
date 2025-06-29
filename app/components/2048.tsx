"use client";

import React, { useEffect, useState, useCallback } from "react";

// --- Dynamic grid size support ---
const MIN_GRID_SIZE = 4;
const MAX_GRID_SIZE = 8;
const DEFAULT_GRID_SIZE = 4;

// For each grid size, the "win" tile is:
// 4x4: 2048, 5x5: 4096, 6x6: 8192, 7x7: 16384, 8x8: 32768
function getWinTile(gridSize: number) {
  switch (gridSize) {
    case 4: return 2048;
    case 5: return 4096;
    case 6: return 8192;
    case 7: return 16384;
    case 8: return 32768;
    default: return 2048;
  }
}

// Tailwind-based cell color classes
const CELL_CLASSES: Record<
  number,
  { bg: string; text: string; 
   }
> = {
  0:    { bg: "bg-white/40", text: "text-gray-500" },
  2:    { bg: "bg-yellow-50/50", text: "text-gray-500" },
  4:    { bg: "bg-orange-100/50", text: "text-gray-500" },
  8:    { bg: "bg-orange-200/50", text: "text-gray-500" },
  16:   { bg: "bg-orange-300/50", text: "text-gray-500" },
  32:   { bg: "bg-orange-400/50", text: "text-white" },
  64:   { bg: "bg-orange-500/50", text: "text-white" },
  128:  { bg: "bg-yellow-300/50", text: "text-gray-500" },
  256:  { bg: "bg-yellow-400/50", text: "text-gray-500" },
  512:  { bg: "bg-yellow-500/50", text: "text-gray-500" },
  1024: { bg: "bg-yellow-600/50", text: "text-gray-500" },
  2048: { bg: "bg-yellow-700/50", text: "text-white" },
  4096: { bg: "bg-indigo-200/50", text: "text-white" },
  8192: { bg: "bg-blue-200/50", text: "text-white" },
  16384: { bg: "bg-green-200/50", text: "text-white" },
  32768: { bg: "bg-pink-200/50", text: "text-white" },
  65536: { bg: "bg-purple-200/50", text: "text-white" },
};

function getCellClass(cell: number) {
  // fallback for >2048
  if (!CELL_CLASSES[cell]) {
    // Use a color ring for fun, but fallback to bg-indigo-100
    const colorRing = [
      "bg-indigo-100", "bg-blue-100", "bg-green-100", "bg-pink-100", "bg-purple-100"
    ];
    const idx = (cell.toString(2).length) % colorRing.length;
    return `w-24 h-24 ${colorRing[idx]} text-gray-900 border-2 border-gray-400 transition-colors duration-200 text-2xl sm:text-3xl`;
  }
  const { bg, text } = CELL_CLASSES[cell];
  return `w-24 h-24 ${bg} ${text} transition-colors duration-200 text-2xl sm:text-3xl`;
}

function getEmptyGrid(gridSize: number) {
  return Array(gridSize)
    .fill(0)
    .map(() => Array(gridSize).fill(0));
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function addRandomTile(grid: number[][]) {
  const gridSize = grid.length;
  const empty: [number, number][] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[getRandomInt(empty.length)];
  const newValue = Math.random() < 0.9 ? 2 : 4;
  const newGrid = grid.map((row) => row.slice());
  newGrid[r][c] = newValue;
  return newGrid;
}

function transpose(grid: number[][]) {
  return grid[0].map((_, i) => grid.map((row) => row[i]));
}

function compress(row: number[], gridSize: number) {
  const newRow = row.filter((n) => n !== 0);
  while (newRow.length < gridSize) newRow.push(0);
  return newRow;
}

function merge(row: number[], gridSize: number) {
  let score = 0;
  for (let i = 0; i < gridSize - 1; i++) {
    if (row[i] !== 0 && row[i] === row[i + 1]) {
      row[i] *= 2;
      score += row[i];
      row[i + 1] = 0;
      i++;
    }
  }
  return { row, score };
}

function operateLeft(grid: number[][]) {
  const gridSize = grid.length;
  let moved = false;
  let score = 0;
  const newGrid = grid.map((row) => {
    let compressed = compress(row, gridSize);
    const merged = merge(compressed, gridSize);
    score += merged.score;
    compressed = compress(merged.row, gridSize);
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  return { newGrid, moved, score };
}

function operateRight(grid: number[][]) {
  const gridSize = grid.length;
  let moved = false;
  let score = 0;
  const newGrid = grid.map((row) => {
    const reversed = row.slice().reverse();
    let compressed = compress(reversed, gridSize);
    const merged = merge(compressed, gridSize);
    score += merged.score;
    compressed = compress(merged.row, gridSize);
    compressed = compressed.reverse();
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  return { newGrid, moved, score };
}

function operateUp(grid: number[][]) {
  const gridSize = grid.length;
  let moved = false;
  let score = 0;
  let transposed = transpose(grid);
  transposed = transposed.map((row) => {
    let compressed = compress(row, gridSize);
    const merged = merge(compressed, gridSize);
    score += merged.score;
    compressed = compress(merged.row, gridSize);
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  const newGrid = transpose(transposed);
  return { newGrid, moved, score };
}

function operateDown(grid: number[][]) {
  const gridSize = grid.length;
  let moved = false;
  let score = 0;
  let transposed = transpose(grid);
  transposed = transposed.map((row) => {
    const reversed = row.slice().reverse();
    let compressed = compress(reversed, gridSize);
    const merged = merge(compressed, gridSize);
    score += merged.score;
    compressed = compress(merged.row, gridSize);
    compressed = compressed.reverse();
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  const newGrid = transpose(transposed);
  return { newGrid, moved, score };
}

function isGameOver(grid: number[][]) {
  const gridSize = grid.length;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 0) return false;
      if (c < gridSize - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < gridSize - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function hasWinTile(grid: number[][], winTile: number) {
  return grid.some((row) => row.includes(winTile));
}

// Modified Keycap: now supports onClick and aria-label
function Keycap({
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex w-8 cursor-pointer h-8 items-center justify-center bg-white/40 text-gray-800 rounded text-base select-none"
      style={{ minWidth: "2.2rem", minHeight: "2.2rem", fontFamily: "inherit" }}
      onClick={onClick}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {children}
    </button>
  );
}

// Modal component for win/lose
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40">
      <div className="bg-white/60 border-2 border-white/40 rounded-lg shadow-2xl px-8 py-6 flex flex-col items-center min-w-[18rem]">
        <div className="text-xl font-bold mb-2 text-center text-gray-700">{title}</div>
        <div className="mb-4 text-center ">{children}</div>
        <button
          className="px-4 py-2 cursor-pointer w-full text-sm bg-blue-500 text-white rounded hover:bg-blue-600 font-bold"
          onClick={onClose}
        >
          Restart
        </button>
      </div>
    </div>
  );
}

export default function Hello2048() {
  // --- Dynamic grid size state ---
  const [gridSize, setGridSize] = useState<number>(DEFAULT_GRID_SIZE);
  const [grid, setGrid] = useState<number[][]>(getEmptyGrid(DEFAULT_GRID_SIZE));
  const [score, setScore] = useState(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInitialized, setIsInitialized] = useState(false);

  // The win tile for this grid size
  const winTile = getWinTile(gridSize);

  // Load highest score from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`hello2048_highestScore_${gridSize}`);
      if (stored && !isNaN(Number(stored))) {
        setHighestScore(Number(stored));
      } else {
        setHighestScore(0);
      }
    }
  }, [gridSize]);

  // Update highest score in localStorage if score increases
  useEffect(() => {
    if (score > highestScore) {
      setHighestScore(score);
      if (typeof window !== "undefined") {
        localStorage.setItem(`hello2048_highestScore_${gridSize}`, String(score));
      }
    }
  }, [score, highestScore, gridSize]);

  // Initialize the game with random tiles only after component mounts or gridSize changes
  useEffect(() => {
    let g = getEmptyGrid(gridSize);
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
    setScore(0);
    setWon(false);
    setOver(false);
    setIsInitialized(true);
  }, [gridSize]);

  const handleMove = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (over || won) return;
      let result;
      if (direction === "left") result = operateLeft(grid);
      else if (direction === "right") result = operateRight(grid);
      else if (direction === "up") result = operateUp(grid);
      else result = operateDown(grid);

      if (result.moved) {
        const newGrid = addRandomTile(result.newGrid);
        setGrid(newGrid);
        setScore((s) => s + result.score);
        if (hasWinTile(newGrid, winTile)) setWon(true);
        else if (isGameOver(newGrid)) setOver(true);
      }
    },
    [grid, over, won, winTile]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        handleMove("left");
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        handleMove("right");
      } else if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        handleMove("up");
      } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        handleMove("down");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // Fix: restart should re-initialize the grid with 2 random tiles
  function restart() {
    let g = getEmptyGrid(gridSize);
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
    setScore(0);
    setWon(false);
    setOver(false);
    setIsInitialized(true);
  }

  // --- Size selector handler ---
  function handleGridSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSize = parseInt(e.target.value, 10);
    setGridSize(newSize);
    setIsInitialized(false);
  }

  // --- Responsive grid width ---
  const gridWidth = Math.min(6 * gridSize, 32); // max 32rem

  // --- Keycap click handlers ---
  const keycapHandlers = {
    W: () => handleMove("up"),
    A: () => handleMove("left"),
    S: () => handleMove("down"),
    D: () => handleMove("right"),
  };

  return (
    <div className="flex flex-col items-center font-mono" style={{ width: `${gridWidth + 2}rem` }}>
      <div className="flex flex-row w-full justify-between mb-2">
        <div className="text-lg bg-white/40 px-2 py-2 rounded text-gray-500 text-center flex-1 mr-2">
          Score: {score}
        </div>
        <div className="text-lg bg-yellow-100/60 px-2 py-2 rounded text-yellow-700 text-center flex-1 ">
          Highest: {highestScore}
        </div>
      </div>
      <div
        className={`grid gap-2 p-4`}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 6rem)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={r + "-" + c}
              className={`flex items-center justify-center rounded text-2xl sm:text-3xl font-bold select-none ${getCellClass(cell)}`}
            >
              {cell !== 0 ? cell : ""}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex flex-col items-center">
        <div className="flex flex-row items-center justify-center gap-2">
          <Keycap onClick={keycapHandlers.W} aria-label="Move Up">W</Keycap>
          <Keycap onClick={keycapHandlers.A} aria-label="Move Left">A</Keycap>
          <Keycap onClick={keycapHandlers.S} aria-label="Move Down">S</Keycap>
          <Keycap onClick={keycapHandlers.D} aria-label="Move Right">D</Keycap>
          <span className="ml-5 flex items-center gap-1">
            <select
              id="size-select"
              className="bg-white/40 border-none cursor-pointer rounded pr-4 pl-4 py-2 text-sm focus:outline-none appearance-none"
              value={gridSize}
              onChange={handleGridSizeChange}
              style={{ minWidth: "3.5rem" }}
            >
              {Array.from({ length: MAX_GRID_SIZE - MIN_GRID_SIZE + 1 }, (_, i) => MIN_GRID_SIZE + i).map((sz) => (
                <option key={sz} value={sz}>{sz}x{sz}</option>
              ))}
            </select>
          </span>
        </div>
      </div>
      <Modal
        open={won || over}
        onClose={restart}
        title={won ? "You win!" : over ? "Game Over" : ""}
      >
        <div className={won ? "text-green-600 font-bold text-md" : "text-red-500 font-bold text-md"}>
          {won
            ? `Congratulations! You reached ${winTile}.`
            : over
            ? "No more moves left. "
            : ""}
        </div>
      </Modal>


    </div>
  );
}
