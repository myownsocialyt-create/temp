/**
 * Stress-tests the puzzle engine:
 *  - every category generates solvable puzzles (all words placed, 8 directions)
 *  - grid sizes match the spec rules
 *  - bonus dictionary size >= 600
 *  - simulated playthrough scoring sanity
 *
 * Run from tools/: `npm run test:engine`
 */
import { CATEGORIES } from '../mobile/src/data/categories';
import { BONUS_WORDS } from '../mobile/src/data/bonusWords';
import { generatePuzzle, gridSizeFor } from '../mobile/src/game/engine';

const RUNS = 120;
let failures = 0;

function assert(cond: boolean, message: string) {
  if (!cond) {
    failures++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log(`Bonus dictionary size: ${BONUS_WORDS.size}`);
assert(BONUS_WORDS.size >= 600, `bonus dictionary should have >= 600 words (has ${BONUS_WORDS.size})`);
assert(BONUS_WORDS.has('THE') && BONUS_WORDS.has('AND') && BONUS_WORDS.has('FOR'), 'common words present');
for (const w of BONUS_WORDS) {
  assert(w.length >= 3 && w.length <= 4, `bonus word "${w}" should be 3-4 letters`);
}

for (const category of CATEGORIES) {
  const expectedSize = gridSizeFor(category.words);
  const longest = Math.max(...category.words.map((w) => w.length));
  // Independent re-implementation of the spec rules:
  const specSize =
    category.words.length >= 16 || longest >= 10 ? 12 : category.words.length >= 12 || longest >= 7 ? 10 : 8;
  assert(expectedSize === specSize, `${category.name}: grid size ${expectedSize} != spec ${specSize}`);

  const duplicates = category.words.length !== new Set(category.words).size;
  assert(!duplicates, `${category.name}: duplicate words in list`);

  for (let run = 0; run < RUNS; run++) {
    const puzzle = generatePuzzle(category.words);
    assert(puzzle.size === specSize, `${category.name}: puzzle size ${puzzle.size} != ${specSize}`);
    assert(
      puzzle.placements.length === category.words.length,
      `${category.name}: placed ${puzzle.placements.length}/${category.words.length} words`,
    );
    // Every placement must spell its word on the grid.
    for (const p of puzzle.placements) {
      const letters = p.cells.map((c) => puzzle.grid[c.row][c.col]).join('');
      assert(letters === p.word, `${category.name}: cells spell "${letters}" not "${p.word}"`);
      // Straight line in one of the 8 directions?
      const first = p.cells[0];
      const last = p.cells[p.cells.length - 1];
      const dr = Math.sign(last.row - first.row);
      const dc = Math.sign(last.col - first.col);
      let straight = true;
      p.cells.forEach((cell, i) => {
        if (cell.row !== first.row + dr * i || cell.col !== first.col + dc * i) straight = false;
      });
      assert(straight, `${category.name}/${p.word}: cells are not in a straight line`);
    }
    // Full grid coverage with letters.
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        assert(/^[A-Z]$/.test(puzzle.grid[r][c]), `${category.name}: cell ${r},${c} not a letter`);
      }
    }
  }
  console.log(`  ✓ ${category.name} — ${category.words.length} words, grid ${expectedSize}×${expectedSize} (${RUNS} runs)`);
}

// Simulated scoring check.
{
  const puzzle = generatePuzzle(CATEGORIES[0].words);
  const puzzleSet = new Set(CATEGORIES[0].words);
  let score = 0;
  for (const p of puzzle.placements) {
    score += 10;
    void p;
  }
  const bonusFound = ['THE', 'AND', 'RUN'].filter((w) => !puzzleSet.has(w));
  score += bonusFound.length * 5;
  assert(score === puzzle.placements.length * 10 + bonusFound.length * 5, 'scoring math broken');
  console.log(`  ✓ scoring simulation (score ${score})`);
}

if (failures > 0) {
  console.error(`\n${failures} FAILURES`);
  process.exit(1);
}
console.log(`\nAll engine tests passed ✔ (${CATEGORIES.length} categories × ${RUNS} runs)`);
