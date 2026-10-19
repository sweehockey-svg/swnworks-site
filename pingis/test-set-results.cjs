const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const source = html.slice(html.indexOf('function setResult(raw){'), html.indexOf('const headers='));
const setResult = new Function(source + ';return setResult')();
const raw = sets => Array.from({ length: 3 }, (_, i) => sets[i]?.map(String) || ['', '']);

test('counts straight-set and three-set wins in either direction', () => {
  for (const [sets, a, b] of [
    [[[11, 0], [11, 9]], 2, 0],
    [[[5, 11], [11, 13]], 0, 2],
    [[[11, 5], [8, 11], [13, 11]], 2, 1],
    [[[9, 11], [12, 10], [18, 20]], 1, 2]
  ]) assert.deepEqual(setResult(raw(sets)), { sets: sets.map(([a, b]) => ({ a, b })), a, b });
});
test('rejects unfinished, tied, decimal and invalid deuce scores', () => {
  for (const pair of [[10, 8], [11, 10], [11, 11], [12, 9], [13, 10], [-1, 11], [11, 3.5], ['', 11], ['NaN', 11], ['Infinity', 11]]) {
    assert.throws(() => setResult(raw([pair, [11, 5]])), undefined, String(pair));
  }
});
test('requires a complete match, ordered sets and no third set after 2–0', () => {
  assert.throws(() => setResult(raw([[11, 5]])));
  assert.throws(() => setResult(raw([[11, 5], [8, 11]])));
  assert.throws(() => setResult([['', ''], ['11', '5'], ['11', '8']]));
  assert.throws(() => setResult(raw([[11, 5], [11, 8], [11, 3]])));
});
test('empty fields clear both totals and individual set points', () => {
  assert.deepEqual(setResult(raw([])), { sets: [], a: null, b: null });
});
