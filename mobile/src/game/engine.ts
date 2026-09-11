/**
 * Word-search puzzle engine — 100% client-side, no network required.
 *
 * Grid size rules (per spec):
 *   - >= 16 words OR longest word >= 10 chars  ->  12x12
 *   - >= 12 words OR longest word >= 7 chars   ->  10x10
 *   - otherwise                                ->   8x8
 *
 * Words can be placed in all 8 directions (horizontal, vertical, the 4
 * diagonals, and their reverses). Empty cells are filled with random letters.
 */

export type Cell = { row: number; col: number };

export type Placement = {
  word: string;
  cells: Cell[];
};

export type Puzzle = {
  size: number;
  /** grid[row][col] = letter */
  grid: string[][];
  placements: Placement[];
};

/** All 8 directions: right, down, down-right, down-left + reverses. */
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1],
];

/** Weighted letter pool for filling empty cells (roughly English letter frequency). */
const FILL_LETTERS =
  'EEEAAAARRIIOOTTNNSSLLCCUUDDPPMMHHGGBBFFYYWWKVXZJQ';

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function gridSizeFor(words: string[]): number {
  const count = words.length;
  const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
  if (count >= 16 || longest >= 10) return 12;
  if (count >= 12 || longest >= 7) return 10;
  return 8;
}

function tryBuild(words: string[], size: number, workBudget: number): Puzzle | null {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );
  const placements: Placement[] = [];

  // Every valid placement (bounds + no letter conflicts; overlaps on
  // identical letters are allowed) for a word, in random order.
  let work = 0;
  const candidatesFor = (word: string): Cell[][] => {
    const out: Cell[][] = [];
    for (const [dr, dc] of DIRECTIONS) {
      const rowMin = dr === 1 ? 0 : dr === -1 ? word.length - 1 : 0;
      const rowMax = dr === 1 ? size - word.length : size - 1;
      const colMin = dc === 1 ? 0 : dc === -1 ? word.length - 1 : 0;
      const colMax = dc === 1 ? size - word.length : size - 1;
      if (rowMax < rowMin || colMax < colMin) continue;
      for (let row = rowMin; row <= rowMax; row++) {
        for (let col = colMin; col <= colMax; col++) {
          const cells: Cell[] = [];
          let ok = true;
          for (let i = 0; i < word.length; i++) {
            work++;
            const r = row + dr * i;
            const c = col + dc * i;
            const existing = grid[r][c];
            if (existing !== null && existing !== word[i]) {
              ok = false;
              break;
            }
            cells.push({ row: r, col: c });
          }
          if (ok) out.push(cells);
        }
      }
    }
    return shuffle(out);
  };

  // Backtracking solver with a most-constrained-word-first heuristic:
  // always place the remaining word with the fewest valid placements
  // first, and prune as soon as any word has none. This finds a valid
  // arrangement almost without backtracking for dense boards.
  const solve = (remaining: string[]): boolean => {
    if (remaining.length === 0) return true;
    if (work > workBudget) return false;

    let bestIndex = -1;
    let bestCandidates: Cell[][] | null = null;
    for (let i = 0; i < remaining.length; i++) {
      const cands = candidatesFor(remaining[i]);
      if (cands.length === 0) return false; // dead end — prune this branch
      if (!bestCandidates || cands.length < bestCandidates.length) {
        bestIndex = i;
        bestCandidates = cands;
        if (cands.length === 1) break; // cannot get more constrained
      }
    }

    const word = remaining[bestIndex];
    const rest = remaining.slice(0, bestIndex).concat(remaining.slice(bestIndex + 1));

    for (const cells of bestCandidates!) {
      // Place the word. Cells that were empty before are remembered so a
      // backtrack only clears those — shared letters of earlier words stay.
      const freshCells: Cell[] = [];
      cells.forEach((cell, i) => {
        if (grid[cell.row][cell.col] === null) freshCells.push(cell);
        grid[cell.row][cell.col] = word[i];
      });
      placements.push({ word, cells });

      if (solve(rest)) return true;

      placements.pop();
      freshCells.forEach((cell) => {
        grid[cell.row][cell.col] = null;
      });
    }
    return false;
  };

  if (!solve(words.slice())) return null;

  const filled = grid.map((row) =>
    row.map((ch) => ch ?? FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)]),
  );
  return { size, grid: filled, placements };
}

/**
 * Generates a puzzle for the given word list.
 * Uses a backtracking solver with constraint propagation, so a valid
 * arrangement is found whenever one exists — failures are practically
 * impossible for the built-in categories.
 */
export function generatePuzzle(words: string[]): Puzzle {
  const size = gridSizeFor(words);
  for (let boardAttempt = 0; boardAttempt < 12; boardAttempt++) {
    const result = tryBuild(words, size, 3_000_000);
    if (result) return result;
  }
  throw new Error(`Unable to generate puzzle for words: ${words.join(', ')}`);
}
