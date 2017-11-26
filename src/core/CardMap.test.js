const Card = require('./Card');
const CardMap = require('./CardMap');

test('test appending map card', () => {
  let map = new CardMap;
  let card = new Card;
  map.append(card)
  expect(map.map.length).toBe(1);
  let card2 = new Card;
  map.append(card2)
  expect(map.map.length).toBe(2);
  // check card cords
  expect(card2.x).toBe(card.x + card.width);
  expect(card2.y).toBe(card.y);

  // to bottom
  let card3 = new Card;
  map.append(card3, CARD_BOTTOM)
  expect(card3.x).toBe(card.x + card.width);
  expect(card3.y).toBe(card.y + card.height);
});

test('test appending bad card', () => {
  let map = new CardMap;
  expect(() => map.append(1)).toThrow()
  expect(map.map.length).toBe(0);
});

