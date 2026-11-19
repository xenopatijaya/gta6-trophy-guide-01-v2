// Leonida Atlas — progress store.
// Everything the tracker remembers lives in one localStorage record:
// earned trophy ids, per-trophy counters, and the spoiler-safe switch.
// Export downloads that record as JSON; import reads it back.

const STORAGE_KEY = 'leonida-atlas-v2-progress';

export function emptyState() {
  return { earned: [], counters: {}, spoilerSafe: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
      spoilerSafe: parsed.spoilerSafe !== false,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function demoState() {
  // A seeded mid-run save, used by ?seed=demo for previews and screenshots:
  // 13 of 55 earned (Chapter 1 story beats among them, so spoiler-safe mode
  // has earned story names to reveal) and counters part-way on the big grinds.
  return {
    earned: [2, 3, 8, 9, 10, 11, 12, 13, 20, 21, 29, 33, 41],
    counters: { 15: 47, 19: 4, 28: 3, 30: 1, 31: 22, 32: 11, 35: 38 },
    spoilerSafe: true,
  };
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-atlas-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function parseImported(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.earned)) throw new Error('not an atlas progress file');
  return {
    earned: parsed.earned.filter((n) => Number.isInteger(n)),
    counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
    spoilerSafe: parsed.spoilerSafe !== false,
  };
}
