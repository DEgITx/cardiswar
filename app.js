var CARD_TOP = 1;
var CARD_RIGHT = 2;
var CARD_BOTTOM = 3;
var CARD_LEFT = 4;

var CARD_ID = 0;
class Card
{
	constructor(image)
	{
		this.id = ++CARD_ID;
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
		var obj = Object.assign({}, this);
		obj.nextCard = null;
		obj.prevCard = null;
		obj.mapPlayers = [];
		for(var id in this.mapPlayers)
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
}

class PrisonCard extends Card 
{
	constructor(stepskip)
	{
		super();
		this.stepskip = stepskip || 2;
		this.image = 'images/cards/prison.png';
	}
	
	postStep(map, player, position)
	{
		player.stepskip = this.stepskip;
	}
	
	preStep(map, player, position)
	{
		// пропуск хода
		if(player.stepskip > 0)
		{
			player.stepskip--;
			return false;
		}
		return true;
	}
}

var CARD_GROUP_ID = 0;
class CardGroup {
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
	
	payPenality(culprit)
	{
		if(culprit == this.owner)
		{
			console.log('you own this card');
			return;
		}
		
		if(this.penalty[this.currentPenalty] != null && this.penalty[this.currentPenalty] > 0)
		{
			culprit.money -= this.penalty[this.currentPenalty];
			this.owner.money += this.penalty[this.currentPenalty];
		}
		if(this.currentPenalty < this.penalty.length - 1)
			this.currentPenalty++
		else
			this.currentPenalty = 0;
	}
	
	toJSON()
	{
		var obj = Object.assign({}, this);
		obj.nextCard = null;
		obj.prevCard = null;
		if(obj.owner != null)
			obj.owner = obj.owner.id;
		obj.mapPlayers = [];
		for(var id in this.mapPlayers)
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
	}
	
	removePlayer(player)
	{
		player.inventory.forEach(function(card){
			card.owner = null;
		});
		if(this.players[player.id] != null)
			delete this.map[this.players[player.id].position].mapPlayers[player.id];
		delete this.players[player.id];
		this.playersKeys = Object.keys(this.players);
	}

	makeStep(player)
	{
		if(this.players[this.playersKeys[this.currentTurn]].id != player.id)
		{
			console.log('not player turn');
			return [];
		}
		
		var roll = Math.floor((Math.random() * 6) + 1);
		//var roll = 1;
		var currentPosition = this.players[player.id].position;
		console.log('or: ' + roll);
		var path = [];
		var cell = this.map[currentPosition];
		delete cell.mapPlayers[player.id];
		path.push(cell.id);		

		if(this.currentTurn < this.playersKeys.length - 1)
			this.currentTurn++;
		else
			this.currentTurn = 0;
		
		// Выпоняем действия карты перед ходом
		if(!cell.preStep(this, player, this.players[player.id].position))
		{
			return path;
		}
		
		while (roll-- > 0)
		{
			cell = cell.nextCard;
			path.push(cell.id);
		}
		this.players[player.id].position = cell.id;
		cell.mapPlayers[player.id] = player;
		console.log(this.players[player.id].position);
		
		// Выплата штрафа
		if(cell instanceof PurchaseCard && cell.owner != null && cell.owner != player)
		{
			cell.payPenality(player);
		}
		
		// Выпоняем действия карты после хода
		cell.postStep(this, player, this.players[player.id].position);
		
		return path;
	}
	
	buyCard(player)
	{
		var currentPosition = this.players[player.id].position;
		var card = this.map[currentPosition];
		if(!(card instanceof PurchaseCard))
		{
			console.log('this is not pushase card');
			return false;
		}
		
		if(player.money < card.cost)
		{
			console.log('too high cost for this card');
			return false;
		}
		
		if(card.owner != null)
		{
			console.log('card already owned');
			return false;
		}
		
		player.money -= card.cost;
		card.owner = player;
		player.inventory.push(card);
		if(card.group != null)
		{
			if(player.cardGroupMap[card.group.id] == null)
				player.cardGroupMap[card.group.id] = [];
			player.cardGroupMap[card.group.id].push(card);
			player.cardGroupMap[card.group.id].forEach(function(card){
				card.groupEffect = player.cardGroupMap[card.group.id].length;
			});
		}
		return true;
	}
	
}

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8099);

app.get('/', function (req, res)
{
	res.sendfile(__dirname + '/index.html');
}
);

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



// Рисуем карту
map.append(new WhiteCard); // Старт
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

io.on('connection', function (socket)
{
	// Добавляем нового игрока
	players[socket.id] =
	{
		id : socket.id,
		money : 10000,
		inventory: [],
		stepskip : 0,
		cardGroupMap: {},
		nick: '',
	};
	console.log('player connected with id: ' + socket.id);

	socket.on('disconnect', function ()
	{
		socket.broadcast.emit('leftplayer',
		{
			player : players[socket.id]
		}
		);
		map.removePlayer(players[socket.id])
		delete players[socket.id];
		console.log('player left with id: ' + socket.id);
	}
	);
	
	socket.on('join', function (data)
	{
		players[socket.id].nick = data.nick;
		map.addPlayer(players[socket.id]);
		console.log('player joins with id: ' + socket.id + "and nick: " + players[socket.id].nick);
		console.log(map);
		socket.emit('join',
		{
			player : players[socket.id],
			map: map
		}
		);
		socket.broadcast.emit('joinplayer',
		{
			player : players[socket.id],
			map: map
		}
		);
	}
	);
	
	socket.on('makestep', function (data)
	{
		if (players[socket.id] == null)
		{
			return;
		}
		var path = map.makeStep(players[socket.id]);
		io.sockets.emit('makestep',
		{
			player : players[socket.id],
			map : map,
			path : path,
			turn : map.players[map.playersKeys[map.currentTurn]],
		}
		);
	}
	);
	
	socket.on('buycard', function (data)
	{
		if (players[socket.id] == null)
		{
			return;
		}
		var result = map.buyCard(players[socket.id]);
		io.sockets.emit('buycard',
		{
			player : map.players[socket.id],
			players : map.players,
			result : result
		}
		);
	}
	);

}
);
