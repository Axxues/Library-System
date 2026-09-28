function recommend(historyIds, scannedBook, catalog, coBorrow, popularity, k = 5) {
  const skip = new Set(historyIds || []);
  if (scannedBook) skip.add(scannedBook.id);
  const co = coBorrow || {};
  const nested = scannedBook && co[scannedBook.id];
  const coMap = nested && typeof nested === 'object' ? nested : co;
  return catalog
    .filter((b) => !skip.has(b.id))
    .map((b) => {
      let s = 0;
      if (scannedBook) {
        if (b.author === scannedBook.author) s += 3;
        if (b.genre === scannedBook.genre) s += 2;
      }
      s += coMap[b.id] || 0;
      const pop = popularity?.[b.id] || 0;
      s += Math.min(pop, 5) * 0.5;
      return { id: b.id, s, pop };
    })
    .sort((a, b) => b.s - a.s || b.pop - a.pop || a.id - b.id)
    .slice(0, k)
    .map((r) => r.id);
}

module.exports = { recommend };
