const Card = require('./Card');

test('test card creation', () => {
  let card1 = new Card;
  expect(card1.id).toBe(1);
  let card2 = new Card;
  expect(card2.id).toBe(2);
});