var CARD_TOP = 1;
var CARD_RIGHT = 2;
var CARD_BOTTOM = 3;
var CARD_LEFT = 4;

class Card
{
	constructor()
	{
		this.nextCard = null;
		this.prevCard = null;

		this.x = 50;
		this.y = 50;
		this.height = 70;
		this.width = 70;
	}

	toJSON()
	{
		var obj = Object.assign({}, this);
		obj.nextCard = null;
		obj.prevCard = null;
		return obj;
	}
}

class PrisonCard extends Card 
{
	constructor(stepskip)
	{
		super();
		this.stepskip = stepskip || 2;
	}
}

class PurchaseCard extends Card 
{
	constructor(cost, penalty)
	{
		super();
		this.cost = cost || 0;
		this.penalty = penalty || [];
		this.currentPenalty = 0;
		this.owner = null;
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
		obj.owner = 0;
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
		this.playersKeys = Object.keys(this.players);
	}
	
	removePlayer(player)
	{
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
		var currentPosition = this.players[player.id].position;
		console.log('or: ' + roll);
		var path = [];
		var cell = this.map[currentPosition];
		path.push(cell.id);		

		if(this.currentTurn < this.playersKeys.length - 1)
			this.currentTurn++;
		else
			this.currentTurn = 0;
		
		// пропуск хода
		if(player.stepskip > 0)
		{
			player.stepskip--;
			return path;
		}
		
		while (roll-- > 0)
		{
			cell = cell.nextCard;
			path.push(cell.id);
		}
		this.players[player.id].position = cell.id;
		console.log(this.players[player.id].position);
		
		// Выплата штрафа
		if(cell instanceof PurchaseCard && cell.owner != null && cell.owner != player)
		{
			cell.payPenality(player);
		}
		
		if(cell instanceof PrisonCard)
		{
			player.stepskip = cell.stepskip;
		}
		
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

var players = {};
var map = new CardMap;
map.append(new PurchaseCard(1000, [2000]));
map.append(new PurchaseCard(1000, [2000]));
map.append(new PrisonCard);
map.append(new Card, CARD_BOTTOM);
map.append(new Card, CARD_BOTTOM);
map.append(new Card, CARD_BOTTOM);
map.append(new Card, CARD_LEFT);
map.append(new Card, CARD_LEFT);
map.append(new Card, CARD_TOP);
map.append(new Card, CARD_TOP);

io.on('connection', function (socket)
{
	// Добавляем нового игрока
	players[socket.id] =
	{
		id : socket.id,
		money : 10000,
		inventory: [],
		stepskip : 0,
	};
	map.addPlayer(players[socket.id]);
	console.log('player joins with id: ' + socket.id);
	console.log(map);
	socket.emit('join',
	{
		player : players[socket.id],
		map: map
	}
	);
	socket.broadcast.emit('joinplayer',
	{
		player : players[socket.id]
	}
	);

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
			players : map.players,
			path : path
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
