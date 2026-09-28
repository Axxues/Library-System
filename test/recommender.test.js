const test = require('node:test');
const assert = require('node:assert');
const { recommend } = require('../server/recommender');
const catalog = [
  { id: 1, author: 'Jose Rizal', genre: 'Fiction' },
  { id: 2, author: 'Jose Rizal', genre: 'Fiction' },
  { id: 3, author: 'Robert Martin', genre: 'Technology' },
  { id: 4, author: 'J.R.R. Tolkien', genre: 'Fantasy' },
];
test('content match ranks same-author first', () => {
  const out = recommend([1], { id: 1, author: 'Jose Rizal', genre: 'Fiction' }, catalog, {}, { 2: 0, 3: 0, 4: 0 }, 2);
  assert.deepStrictEqual(out[0], 2);
});
test('cold start falls back to popularity', () => {
  const out = recommend([], null, catalog, {}, { 4: 9, 3: 5, 2: 1 }, 1);
  assert.deepStrictEqual(out, [4]);
});
