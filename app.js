var CARD_TOP = 1;
var CARD_RIGHT = 2;
var CARD_BOTTOM = 3;
var CARD_LEFT = 4;

var CARD_ID = 0;
class Card
{
	constructor(image)
	{
		this.id = CARD_ID++;
		this.nextCard = null;
		this.prevCard = null;
		this.mapPlayers = {};

		this.x = 50;
		this.y = 50;
		this.height = 70;
		this.width = 70;

		this.image = image || '';
		this.needFill = false;
		this.fillColor = 0xFFFFFF;

		this.text = '';
		this.description = '';
	}

	toJSON()
	{
		var obj = Object.assign(
		{}, this);
		obj.nextCard = null;
		obj.prevCard = null;
		obj.mapPlayers = [];
		for (var id in this.mapPlayers)
			obj.mapPlayers.push(id);
		return obj;
	}

	postStep(map, player, position)
	{

	}

	preStep(map, player, position)
	{
		return true;
	}

	inStep(map, player, position)
	{

	}
}

class PrisonCard extends Card
{
	constructor(stepskip)
	{
		super();
		this.stepskip = stepskip || 2;
		this.image = 'images/cards/prison.png';
		this.description = 'Добро пожаловать тюрячку. Вы сами знаете что сдесь делают. Вы пропускаете 2 хода (кликать нужно).';
	}

	postStep(map, player, position)
	{
		player.stepskip = this.stepskip;
	}

	preStep(map, player, position)
	{
		// пропуск хода
		console.log('Player ' + player.nick + "in prison left: " + player.stepskip + ' stepskips');
		if (player.stepskip > 0)
		{
			player.stepskip--;
			return false;
		}
		return true;
	}
}

var CARD_GROUP_ID = 0;
class CardGroup
{
	constructor(color, image, text)
	{
		this.id = ++CARD_GROUP_ID;
		this.color = color || '0xFF0000';
		this.image = image || '';
		this.text = text || '';
		this.description = '';
	}
}

class PurchaseCard extends Card
{
	constructor(cost, penalty, group)
	{
		super();
		this.cost = cost || 0;
		this.penalty = penalty || [];
		this.currentPenalty = 0;
		this.owner = null;
		this.group = group || null;
		this.groupEffect = 0;
	}

	postStep(map, player, position)
	{
		if (this.owner == null || this.owner == player)
		{
			console.log('Nothing to pay');
			return;
		}

		if (this.penalty[this.currentPenalty] != null && this.penalty[this.currentPenalty] > 0)
		{
			player.money -= this.penalty[this.currentPenalty];
			this.owner.money += this.penalty[this.currentPenalty];
		}
		if (this.currentPenalty < this.penalty.length - 1)
			this.currentPenalty++
			else
				this.currentPenalty = 0;

		function canPlayerRehab(player)
		{
			var costSum = 0;
			player.inventory.forEach(function(card, index)
			{
				if (card instanceof PurchaseCard)
				{
					costSum += card.cost;
				}
			});
			return player.money + costSum > 0;
		}

		// проигравшие
		if (player.money <= 0)
		{
			if (canPlayerRehab(player))
			{
				map.losers.push(player);
				console.log('adding player ' + player.nick + ' to losers list');
			}
			//else
			//	map.removePlayer(player);
		}

		if (this.owner.money <= 0)
		{
			if (canPlayerRehab(this.owner))
			{
				map.losers.push(this.owner);
				console.log('adding player ' + this.owner.nick + ' to losers list');
			}
			//else
			//	map.removePlayer(this.owner);
		}
	}

	preStep(map, player, position)
	{
		if (player.money <= 0)
			return false;

		return true;
	}

	toJSON()
	{
		var obj = Object.assign(
		{}, this);
		obj.nextCard = null;
		obj.prevCard = null;
		if (obj.owner != null)
			obj.owner = obj.owner.id;
		obj.mapPlayers = [];
		for (var id in this.mapPlayers)
			obj.mapPlayers.push(id);
		return obj;
	}
}

class CardMap
{
	constructor()
	{
		this.map = [];
		this.players = {};
		this.playersKeys = [];
		this.currentTurn = 0;
		this.losers = [];
	}

	append(card, position)
	{
		position = position || CARD_RIGHT;
		if (this.map.length > 0)
		{
			this.map[this.map.length - 1].nextCard = card;
			card.prevCard = this.map[this.map.length - 1];
			card.nextCard = this.map[0];
			this.map[0].prevCard = card;
		}
		else
		{
			card.nextCard = this.map[0];
			card.prevCard = this.map[0];
		}
		if (this.map.length > 0)
		{
			switch (position)
			{
				case CARD_TOP:
					card.x = this.map[this.map.length - 1].x;
					card.y = this.map[this.map.length - 1].y - card.height;
					break;
				case CARD_RIGHT:
					card.x = this.map[this.map.length - 1].x + this.map[this.map.length - 1].width;
					card.y = this.map[this.map.length - 1].y;
					break;
				case CARD_BOTTOM:
					card.x = this.map[this.map.length - 1].x;
					card.y = this.map[this.map.length - 1].y + this.map[this.map.length - 1].height;
					break;
				case CARD_LEFT:
					card.x = this.map[this.map.length - 1].x - card.width;
					card.y = this.map[this.map.length - 1].y;
					break;
			}
		}
		card.id = this.map.length;
		this.map.push(card);
	}

	addPlayer(player)
	{
		player.position = 0;
		this.players[player.id] = player;
		this.map[0].mapPlayers[player.id] = player;
		this.playersKeys = Object.keys(this.players);
		this.currentTurn = Math.floor(Math.random() * this.playersKeys.length);
	}

	removePlayer(player)
	{
		player.inventory.forEach(function(card)
		{
			card.owner = null;
		});
		if (this.players[player.id] != null)
			delete this.map[this.players[player.id].position].mapPlayers[player.id];
		delete this.players[player.id];
		this.playersKeys = Object.keys(this.players);
		if (this.currentTurn > this.playersKeys.length - 1)
		{
			console.log('returning turn to 0');
			this.currentTurn = 0;
		}

		var loserIndex = this.losers.indexOf(player);
		if (loserIndex >= 0)
		{
			console.log('removing player from losser list');
			this.losers.splice(loserIndex, 1);
		}
		console.log('removed player ' + player.nick + ' from game');
	}

	makeStep(player)
	{
		if (this.players[this.playersKeys[this.currentTurn]].id != player.id)
		{
			console.log('not player ' + player.nick + ' turn');
			return [];
		}

		if (this.losers.length > 0)
		{
			console.log('cant make step because of there are some losers');
			return [];
		}

		var roll = Math.floor((Math.random() * 6) + 1);
		//var roll = 1;
		var currentPosition = this.players[player.id].position;
		console.log('player ' + this.players[player.id].nick + ' roll: ' + roll);
		var path = [];
		var cell = this.map[currentPosition];
		path.push(cell.id);

		if (this.currentTurn < this.playersKeys.length - 1)
			this.currentTurn++;
		else
			this.currentTurn = 0;

		// Выпоняем действия карты перед ходом
		if (!cell.preStep(this, player, this.players[player.id].position))
		{
			return path;
		}

		delete cell.mapPlayers[player.id];
		while (roll-- > 0)
		{
			cell = cell.nextCard;
			path.push(cell.id);
			cell.inStep(this, player, this.players[player.id].position);
		}
		this.players[player.id].position = cell.id;
		cell.mapPlayers[player.id] = player;

		// Выпоняем действия карты после хода
		cell.postStep(this, player, this.players[player.id].position);

		return path;
	}

	buyCard(player)
	{
		var currentPosition = this.players[player.id].position;
		var card = this.map[currentPosition];
		if (!(card instanceof PurchaseCard))
		{
			console.log('this is not pushase card');
			return false;
		}

		if (player.money < card.cost)
		{
			console.log('too high cost for this card');
			return false;
		}

		if (card.owner != null)
		{
			console.log('card already owned');
			return false;
		}

		player.money -= card.cost;
		card.owner = player;
		player.inventory.push(card);
		console.log(card.id + " card bouth by player " + player.nick + " he spend " + card.cost + " money");

		if (card.group != null)
		{
			if (player.cardGroupMap[card.group.id] == null)
				player.cardGroupMap[card.group.id] = [];
			player.cardGroupMap[card.group.id].push(card);
			player.cardGroupMap[card.group.id].forEach(function(card)
			{
				card.groupEffect = player.cardGroupMap[card.group.id].length;
			});
		}
		return true;
	}

	sellCard(gamer, cardId)
	{
		var card = this.map[cardId];
		var player = this.players[gamer.id];
		var inventoryIndex = player.inventory.indexOf(card);
		if (inventoryIndex < 0 || !(card instanceof PurchaseCard) || card.owner != player)
		{
			console.log('Error on card selling');
			return -1;
		}

		player.money += card.cost;
		card.owner = null;
		player.inventory.splice(inventoryIndex, 1);
		console.log(card.id + " card selled by player " + player.nick + " he got " + card.cost + " money");

		if (player.money > 0)
		{
			var loserIndex = this.losers.indexOf(player);
			if (loserIndex >= 0)
			{
				console.log('removing player from losser list');
				this.losers.splice(loserIndex, 1);
			}
		}

		if (card.group != null)
		{
			card.groupEffect = 0;
			if (player.cardGroupMap[card.group.id] != null)
			{
				var index = player.cardGroupMap[card.group.id].indexOf(card);
				if (index >= 0)
				{
					console.log('reduce card power afer selling');
					player.cardGroupMap[card.group.id].splice(index, 1);
					player.cardGroupMap[card.group.id].forEach(function(card)
					{
						card.groupEffect = player.cardGroupMap[card.group.id].length;
					});
				}
			}
		}
		return card.id;
	}

}

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8099);

app.get('/', function(req, res)
{
	res.sendfile(__dirname + '/index.html');
});

app.use(express.static('public'));
app.use('/phaser', express.static('node_modules/phaser/build'));
app.use('/phaser-input', express.static('node_modules/phaser-input/build'));

var players = {};
var map = new CardMap;


class WhiteCard extends Card
{
	constructor(image)
	{
		super(image);
		this.needFill = true;
	}
}

class StartCard extends Card
{
	constructor(image)
	{
		super(image);
		this.needFill = true;
		this.description = 'Добро пожаловать на старт. За прохождение старта вы каждый раз получаете 10000';
	}

	inStep(map, player, position)
	{
		player.money += 10000;
	}
}

// Рисуем карту
map.append(new StartCard); // Старт
var sunGroup = new CardGroup(0xD6D600, 'images/cards/sun.png', 'Это солнечный сет, несущий счатье и радость людям. Единственный минус, то что он слабенький.');
map.append(new PurchaseCard(250, [100, 200, 250, 300, 350], sunGroup));
map.append(new WhiteCard);
map.append(new PurchaseCard(350, [200, 350, 500, 600, 750], sunGroup));
map.append(new PurchaseCard(500, [300, 400, 550, 700, 900], sunGroup));
var treeGroup = new CardGroup(0x74E30B, 'images/cards/tree.jpg', 'Древестный сет. Почувствуйте себя настоящим садоводом на поле боя.');
map.append(new PurchaseCard(750, [500, 650, 800, 1000, 1100], treeGroup));
map.append(new PurchaseCard(900, [700, 850, 900, 1200, 1400], treeGroup));
map.append(new PurchaseCard(1000, [800, 950, 1100, 1300, 1500], treeGroup));
map.append(new PrisonCard);
map.append(new PurchaseCard(1250, [1000, 1200, 1400, 1600, 1750], treeGroup));
map.append(new WhiteCard);
map.append(new WhiteCard, CARD_BOTTOM);
var krakenGroup = new CardGroup(0xAA2AEB, 'images/cards/kraken.jpg', 'Вы приютили у себя небольшого кракена. Он машет вам щупальцами в знак благодарности.');
map.append(new PurchaseCard(1500, [1300, 1600, 1800, 2000, 2200], krakenGroup), CARD_BOTTOM);
map.append(new PurchaseCard(1750, [1500, 1800, 2000, 2150, 2500], krakenGroup), CARD_LEFT);
map.append(new WhiteCard, CARD_LEFT);
map.append(new PurchaseCard(2000, [1600, 1800, 2100, 2500, 2750], krakenGroup), CARD_LEFT);
map.append(new PurchaseCard(2500, [2200, 2500, 2800, 3100, 3400], krakenGroup), CARD_LEFT);
var waterGroup = new CardGroup(0x2A74EB, 'images/cards/water.png', 'Вы выбрали путь повелителя водички. Смывайте своих врагов, однако не забывайте закрывать кран.');
map.append(new PurchaseCard(2750, [2600, 2900, 3100, 3300, 3450], waterGroup), CARD_LEFT);
map.append(new PurchaseCard(3000, [2800, 3250, 3500, 3750, 4000], waterGroup), CARD_LEFT);
map.append(new PurchaseCard(3500, [3200, 3500, 3900, 4300, 4700], waterGroup), CARD_LEFT);
map.append(new PrisonCard, CARD_BOTTOM);
map.append(new PurchaseCard(4000, [2200, 4000, 5000, 5200, 5500], waterGroup), CARD_BOTTOM);
var fireGroup = new CardGroup(0xEB342A, 'images/cards/fire.png', 'Вы жгете, раз купили эту карту. Что может быть лучше чем испепялять своих врагов, закидывая их сигаретами?');
map.append(new PurchaseCard(5000, [3500, 4000, 4500, 5200, 5400], fireGroup), CARD_RIGHT);
map.append(new PurchaseCard(5500, [4500, 4700, 5200, 5600, 6000], fireGroup), CARD_RIGHT);
map.append(new WhiteCard);
map.append(new PurchaseCard(5750, [4900, 5400, 5750, 6000, 6400], fireGroup), CARD_RIGHT);
map.append(new PurchaseCard(6000, [5200, 5400, 6100, 6600, 7100], fireGroup), CARD_RIGHT);
map.append(new PurchaseCard(6500, [6500, 7000, 7400, 7600, 8000], fireGroup), CARD_RIGHT);
map.append(new WhiteCard, CARD_RIGHT);
var strangeGroup = new CardGroup(0x8C8C8C, 'images/cards/question_wh.png', 'Очень странный сет карт. Я вам как создатель этого сета заявляю.');
map.append(new PurchaseCard(6969, [4647, 5505, 6969, 6969, 0], strangeGroup), CARD_BOTTOM);
map.append(new PurchaseCard(1408, [1408, 1408, 8041, 8041, 8041], strangeGroup), CARD_BOTTOM);
map.append(new PurchaseCard(1, [0, 0, 1, 1, 1001], strangeGroup), CARD_LEFT);
map.append(new WhiteCard, CARD_LEFT);
map.append(new PurchaseCard(-7000, [-3000, -4000, -5000, 17502, 24242], strangeGroup), CARD_LEFT);
var electricityGroup = new CardGroup(0xFFE17D, 'images/cards/electricity.png', 'Фонарик, дрель, электропсихометр - эти приборы объединяет одно. Их нету у тебя дома. Вообщем электричество.');
map.append(new PurchaseCard(7200, [6500, 6600, 6900, 7800, 9000], electricityGroup), CARD_LEFT);
map.append(new PurchaseCard(8000, [6300, 8000, 9000, 10000, 11000], electricityGroup), CARD_LEFT);
map.append(new WhiteCard, CARD_LEFT);
map.append(new PurchaseCard(9500, [8000, 9500, 11000, 11500, 12000], electricityGroup), CARD_LEFT);
map.append(new PurchaseCard(10000, [8500, 10000, 12500, 14000, 15000], electricityGroup), CARD_LEFT);
map.append(new PrisonCard, CARD_LEFT);
var inyanGroup = new CardGroup(0xDB3B9E, 'images/cards/inyan.jpg', 'Добро и зло - эти 2 карты неразлучны, до того момента пока 2 идиота их не купят, каждый по одной.');
map.append(new PurchaseCard(12500, [10000, 12500, 15000, 17500, 20000], inyanGroup), CARD_TOP);
map.append(new PurchaseCard(15000, [15000, 17500, 20000, 22000, 25000], inyanGroup), CARD_TOP);
var darknessGroup = new CardGroup(0x010101, 'images/cards/darkness.png', 'Лишь тьма. И другие злые эфекты тьмы.');
map.append(new PurchaseCard(18000, [15000, 18000, 20000, 25000, 27500], darknessGroup), CARD_TOP);
map.append(new PurchaseCard(20000, [17500, 19000, 24000, 28000, 30000], darknessGroup), CARD_LEFT);
map.append(new WhiteCard, CARD_TOP);
map.append(new PurchaseCard(25000, [20000, 25000, 30000, 35000, 40000], darknessGroup), CARD_TOP);


io.on('connection', function(socket)
{
	// Добавляем нового игрока
	players[socket.id] = {
		id: socket.id,
		money: 20000,
		inventory: [],
		stepskip: 0,
		cardGroupMap:
		{},
		nick: '',
	};
	console.log('player connected with id: ' + socket.id);

	socket.on('disconnect', function()
	{
		socket.broadcast.emit('leftplayer',
		{
			player: players[socket.id]
		});
		map.removePlayer(players[socket.id])
		delete players[socket.id];
		console.log('player left with id: ' + socket.id);
	});

	socket.on('join', function(data)
	{
		players[socket.id].nick = data.nick;
		map.addPlayer(players[socket.id]);
		console.log('player joins with id: ' + socket.id + "and nick: " + players[socket.id].nick);
		console.log(map);
		socket.emit('join',
		{
			player: players[socket.id],
			map: map
		});
		socket.broadcast.emit('joinplayer',
		{
			player: players[socket.id],
			map: map
		});
	});

	socket.on('makestep', function(data)
	{
		if (players[socket.id] == null)
		{
			return;
		}
		var path = map.makeStep(players[socket.id]);
		io.sockets.emit('makestep',
		{
			player: players[socket.id],
			map: map,
			path: path,
			turn: map.players[map.playersKeys[map.currentTurn]],
		});
		if (map.players[socket.id] == null)
		{
			console.log('lose event for player ' + players[socket.id].nick);
			io.sockets.emit('lose',
			{
				player: players[socket.id]
			});
		}
	});

	socket.on('buycard', function(data)
	{
		if (players[socket.id] == null)
		{
			return;
		}
		var result = map.buyCard(players[socket.id]);
		io.sockets.emit('buycard',
		{
			player: map.players[socket.id],
			players: map.players,
			cell: map.map[map.players[socket.id].position],
			result: result
		});
	});

	socket.on('sellcard', function(data)
	{
		if (players[socket.id] == null)
		{
			return;
		}
		var cell = map.sellCard(players[socket.id], data.id);
		io.sockets.emit('sellcard',
		{
			player: map.players[socket.id],
			players: map.players,
			cell: map.map[cell],
			result: cell >= 0,
			losers: map.losers,
		});
	});

});