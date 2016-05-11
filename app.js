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

		this.cost = 0;
		this.penalty = [];
		this.currentPenalty = 0;
	}

}

class CardMap
{
	constructor()
	{
		this.map = [];
		this.players = {};
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
		this.map.push(card);
	}

	addPlayer(player)
	{
		player.position = 0;
		this.players[player.id] = player;
	}

	makeStep(player)
	{
		var roll = Math.floor((Math.random() * 6) + 1);
		var currentPosition = this.players[player.id].position;
		var cell = this.map[currentPosition];
		while (roll-- > 0)
		{
			cell = cell.nextCard;
		}
		this.players[player.id].position = this.map.indexOf(cell);
		return roll;
	}

	export()
	{
		return {
			players: this.players,
			map: (() => {
				var arr = [];
				for(var i = 0; i < this.map.length ; i++)
				{
					arr.push({
						x : this.map[i].x,
						y : this.map[i].y,
						height : this.map[i].height,
						width : this.map[i].height,
						playerids : [],
					});
				}
				for(var player in players)
				{
					arr[players[player].position].playerids.push(players[player].id);
				}
				return arr;
			})()
		};
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
map.append(new Card);
map.append(new Card);
map.append(new Card);
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
	};
	map.addPlayer(players[socket.id]);
	console.log('player joins with id: ' + socket.id);
	console.log(map.export());
	socket.emit('join',
	{
		player : players[socket.id],
		map: map.export()
	}
	);
	socket.broadcast.emit('joinplayer',
	{
		player : players[socket.id]
	}
	);

	socket.on('disconnect', function ()
	{
		delete players[socket.id];
		socket.broadcast.emit('leftplayer',
		{
			player : players[socket.id]
		}
		);
		console.log('player left with id: ' + socket.id);
	}
	);

	socket.on('makestep', function (data)
	{
		if (players[socket.id] == null)
		{
			return;
		}
		var step = map.makeStep(players[socket.id]);
		io.sockets.emit('makestep',
		{
			player : players[socket.id],
			roll : step
		}
		);
	}
	);

}
);
