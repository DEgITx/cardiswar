const Card = require('./Card');
const StartCard = require('../cards/StartCard')
const PurchaseCard = require('../cards/PurchaseCard')
const CardMap = require('./CardMap');
const Sessions = require('../Sessions')

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


test('simple map', () => {
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

let squereMap = new CardMap;
let card3 = new PurchaseCard(1500, [1300, 1600, 1800, 2000, 2200])

test('simple squere map', () => {
  let startCard = new StartCard;
  squereMap.append(startCard)
  let card2 = new Card;
  squereMap.append(card2, CARD_RIGHT)
  expect(() => squereMap.append(card3, CARD_LEFT)).toThrow()
  squereMap.append(card3, CARD_BOTTOM)

  // check connections
  expect(card2.nextCard).toBe(card3)
  expect(card3.prevCard).toBe(card2)
  expect(card3.nextCard).toBe(startCard)
  expect(startCard.prevCard).toBe(card3)

  squereMap.append(new Card, CARD_LEFT)
  expect(() => squereMap.append(new Card, CARD_TOP)).toThrow()
});

let player1 = Sessions.createPlayer()
let player2 = Sessions.createPlayer('second')
let players = [player1, player2]

test('add player', () => {
  expect(() => squereMap.addPlayer(player1)).toThrow()
  player1.id = 'first'
  squereMap.addPlayer(player1)
  expect(Object.keys(squereMap.players).length).toBe(1);
  squereMap.addPlayer(player2)
});

test('turn', () => {
  let turn = squereMap.currentTurn;
  let other = (turn + 1) % 2
  console.log(turn, other)
  expect(turn >= 0 && turn <= 1).toBeTruthy()
  squereMap.maxRoll = 1
  let path = squereMap.makeStep(players[other])
  expect(path.path.length).toBe(0)
  path = squereMap.makeStep(players[turn])
  expect(path.path.length).toBe(2)
  path = squereMap.makeStep(players[other])
  expect(path.path.length).toBe(2)
  squereMap.makeStep(players[turn])
  if(players[turn] === player2)
  {
    [player1, player2] = [player2, player1]
    players = [player1, player2]
  }
});

test('can buy', () => {
  expect(squereMap.canBuyCard(player1)).toBeTruthy()
  expect(squereMap.canBuyCard(player2)).toBeFalsy()
});

test('buy card', () => {
  const money = player1.money;
  expect(squereMap.buyCard(player1)).toBeTruthy()
  expect(player1.money).toBe(money - card3.cost)
});