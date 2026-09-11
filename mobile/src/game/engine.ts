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

function tryBuild(words: string[], size: number, attemptsPerWord: number): Puzzle | null {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );
  const placements: Placement[] = [];

  // Longest words first (hardest to place); shuffle within same length.
  const ordered = shuffle(words).sort((a, b) => b.length - a.length);

  for (const word of ordered) {
    let placed = false;
    for (let attempt = 0; attempt < attemptsPerWord && !placed; attempt++) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const [dr, dc] = dir;

      // Pick a random start cell such that the whole word fits inside the grid.
      const rowMin = dr === 1 ? 0 : dr === -1 ? word.length - 1 : 0;
      const rowMax = dr === 1 ? size - word.length : dr === -1 ? size - 1 : size - 1;
      const colMin = dc === 1 ? 0 : dc === -1 ? word.length - 1 : 0;
      const colMax = dc === 1 ? size - word.length : dc === -1 ? size - 1 : size - 1;
      if (rowMax < rowMin || colMax < colMin) continue;

      const row = rowMin + Math.floor(Math.random() * (rowMax - rowMin + 1));
      const col = colMin + Math.floor(Math.random() * (colMax - colMin + 1));

      const cells: Cell[] = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        const existing = grid[r][c];
        if (existing !== null && existing !== word[i]) {
          ok = false;
          break;
        }
        cells.push({ row: r, col: c });
      }
      if (!ok) continue;

      cells.forEach((cell, i) => {
        grid[cell.row][cell.col] = word[i];
      });
      placements.push({ word, cells });
      placed = true;
    }
    if (!placed) return null; // restart the whole board
  }

  const filled = grid.map((row) =>
    row.map((ch) => ch ?? FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)]),
  );
  return { size, grid: filled, placements };
}

/**
 * Generates a puzzle for the given word list.
 * Retries with a fresh board if any word fails to place (practically never
 * happens for the built-in categories).
 */
export function generatePuzzle(words: string[]): Puzzle {
  const size = gridSizeFor(words);
  for (let boardAttempt = 0; boardAttempt < 80; boardAttempt++) {
    const result = tryBuild(words, size, 400);
    if (result) return result;
  }
  // Extremely defensive fallback — keep trying with more attempts per word.
  for (let boardAttempt = 0; boardAttempt < 40; boardAttempt++) {
    const result = tryBuild(words, size, 2000);
    if (result) return result;
  }
  throw new Error(`Unable to generate puzzle for words: ${words.join(', ')}`);
}
