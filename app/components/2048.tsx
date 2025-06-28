"use client";

import React, { useEffect, useState, useCallback } from "react";

const GRID_SIZE = 4;

function getEmptyGrid() {
  return Array(GRID_SIZE)
    .fill(0)
    .map(() => Array(GRID_SIZE).fill(0));
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function addRandomTile(grid: number[][]) {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
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


function compress(row: number[]) {
  const newRow = row.filter((n) => n !== 0);
  while (newRow.length < GRID_SIZE) newRow.push(0);
  return newRow;
}

function merge(row: number[]) {
  let score = 0;
  for (let i = 0; i < GRID_SIZE - 1; i++) {
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
  let moved = false;
  let score = 0;
  const newGrid = grid.map((row) => {
    let compressed = compress(row);
    const merged = merge(compressed);
    score += merged.score;
    compressed = compress(merged.row);
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  return { newGrid, moved, score };
}

function operateRight(grid: number[][]) {
  let moved = false;
  let score = 0;
  const newGrid = grid.map((row) => {
    const reversed = row.slice().reverse();
    let compressed = compress(reversed);
    const merged = merge(compressed);
    score += merged.score;
    compressed = compress(merged.row);
    compressed = compressed.reverse();
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  return { newGrid, moved, score };
}

function operateUp(grid: number[][]) {
  let moved = false;
  let score = 0;
  let transposed = transpose(grid);
  transposed = transposed.map((row) => {
    let compressed = compress(row);
    const merged = merge(compressed);
    score += merged.score;
    compressed = compress(merged.row);
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  const newGrid = transpose(transposed);
  return { newGrid, moved, score };
}

function operateDown(grid: number[][]) {
  let moved = false;
  let score = 0;
  let transposed = transpose(grid);
  transposed = transposed.map((row) => {
    const reversed = row.slice().reverse();
    let compressed = compress(reversed);
    const merged = merge(compressed);
    score += merged.score;
    compressed = compress(merged.row);
    compressed = compressed.reverse();
    if (compressed.join() !== row.join()) moved = true;
    return compressed;
  });
  const newGrid = transpose(transposed);
  return { newGrid, moved, score };
}

function isGameOver(grid: number[][]) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function has2048(grid: number[][]) {
  return grid.some((row) => row.includes(2048));
}

export default function Hello2048() {
  const [grid, setGrid] = useState<number[][]>(getEmptyGrid());
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the game with random tiles only after component mounts
  useEffect(() => {
    if (!isInitialized) {
      let g = getEmptyGrid();
      g = addRandomTile(g);
      g = addRandomTile(g);
      setGrid(g);
      setIsInitialized(true);
    }
  }, [isInitialized]);

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
        if (has2048(newGrid)) setWon(true);
        else if (isGameOver(newGrid)) setOver(true);
      }
    },
    [grid, over, won]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key === "a" || e.key === "A") {
        handleMove("left");
      } else if (e.key === "d" || e.key === "D") {
        handleMove("right");
      } else if (e.key === "w" || e.key === "W") {
        handleMove("up");
      } else if (e.key === "s" || e.key === "S") {
        handleMove("down");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  function restart() {
    setGrid(getEmptyGrid());
    setScore(0);
    setWon(false);
    setOver(false);
    setIsInitialized(false);
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">2048</h1>
      <div className="mb-2">Score: {score}</div>
      <div
        className="bg-gray-200 p-4 rounded"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 3.5rem)`,
          gap: "0.5rem",
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={r + "-" + c}
              className={`flex items-center justify-center rounded text-lg font-bold`}
              style={{
                width: "3.5rem",
                height: "3.5rem",
                background: cell
                  ? `hsl(${(cell.toString(2).length * 32) % 360}, 70%, 80%)`
                  : "#eee",
                color: cell ? "#222" : "#bbb",
                transition: "background 0.2s",
                border: cell ? "2px solid #bbb" : "2px solid #ddd",
              }}
            >
              {cell !== 0 ? cell : ""}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 text-sm text-gray-600">
        Use <b>W</b> (up), <b>A</b> (left), <b>S</b> (down), <b>D</b> (right) to move.
      </div>
      {(won || over) && (
        <div className="mt-4 flex flex-col items-center">
          {won && <div className="text-green-600 font-bold text-xl">You win!</div>}
          {over && !won && <div className="text-red-600 font-bold text-xl">Game Over</div>}
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={restart}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
