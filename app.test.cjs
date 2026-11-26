const assert = require('node:assert/strict');
const test = require('node:test');
const { cases, cleanReview, isComplete, readSavedReviews, report } = require('./app.js');

test('each fictional case has a distinct ID, two replies, a customer message and a policy', () => {
  assert.equal(cases.length, 5);
  assert.equal(new Set(cases.map(item => item.id)).size, 5);
  for (const item of cases) {
    assert.ok(item.A && item.B && item.message && item.policy);
    assert.notEqual(item.A, item.B);
  }
});

test('the winner and the deciding factor are both required', () => {
  assert.equal(isComplete(cleanReview({ winner: 'A' })), false);
  assert.equal(isComplete(cleanReview({ reason: 'Clarity' })), false);
  assert.equal(isComplete(cleanReview({ winner: 'B', reason: 'Empathy' })), true);
});

test('storage restores valid reviews and recovers from missing or corrupt data', () => {
  const id = cases[0].id;
  for (const value of ['invalid json', null, 'null']) {
    assert.deepEqual(readSavedReviews(value)[id], cleanReview());
  }
  const state = { [id]: { winner: 'A', reason: 'Clarity', note: 'A specific next step.' } };
  assert.deepEqual(readSavedReviews(JSON.stringify(state))[id], state[id]);
  const invalid = cleanReview({ winner: 'C', reason: 'Unknown', note: 'x'.repeat(1000) });
  assert.equal(invalid.winner, '');
  assert.equal(invalid.reason, '');
  assert.equal(invalid.note.length, 600);
});

test('JSON exports include the evidence and completed decisions while omitting drafts', () => {
  const [first, second] = cases;
  const complete = cleanReview({ winner: 'B', reason: 'Policy accuracy', note: 'Explains the exchange.' });
  const file = JSON.parse(JSON.stringify(report({
    [first.id]: complete, [second.id]: cleanReview({ winner: 'A' }),
  })));
  assert.equal(file.reviews.length, 1);
  assert.equal(file.reviews[0].policy, first.policy);
  assert.deepEqual(file.reviews[0].decision, complete);
  assert.equal(file.reviews[0].replies.B, first.B);
  assert.deepEqual(report({}).reviews, []);
});
