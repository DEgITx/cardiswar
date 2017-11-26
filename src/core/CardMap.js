const Card = require('./Card');
global.CARD_TOP = 1;
global.CARD_RIGHT = 2;
global.CARD_BOTTOM = 3;
global.CARD_LEFT = 4;

const PurchaseCard = require('../cards/PurchaseCard');

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
        if(!(card instanceof Card))
            throw new Error('appending card must be Card type')

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
		card.position = this.map.push(card) - 1;
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

		const loserIndex = this.losers.indexOf(player);
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
			return {
				path: [],
				roll: 0
			};
		}

		if (this.losers.length > 0)
		{
			console.log('cant make step because of there are some losers');
			return {
				path: [],
				roll: 0
			};
		}

		let roll = Math.floor((Math.random() * 6) + 1);
		//let roll = 1;
		const currentPosition = this.players[player.id].position;
		console.log('player ' + this.players[player.id].nick + ' roll: ' + roll);
		let path = [];
		let cell = this.map[currentPosition];
		path.push(cell.position);

		if (this.currentTurn < this.playersKeys.length - 1)
			this.currentTurn++;
		else
			this.currentTurn = 0;

		// Выпоняем действия карты перед ходом
		if (!cell.preStep(this, player, this.players[player.id].position))
		{
			return {
				path: path,
				roll: roll
			};
		}
		let saveRoll = roll;

		delete cell.mapPlayers[player.id];
		while (roll-- > 0)
		{
			cell = cell.nextCard;
			path.push(cell.position);
			cell.inStep(this, player, this.players[player.id].position);
		}
		this.players[player.id].position = cell.position;
		cell.mapPlayers[player.id] = player;

		// Выпоняем действия карты после хода
		cell.postStep(this, player, this.players[player.id].position, path);

		// Проверяем возможность купить карту
		this.players[player.id].canBuyCard = this.canBuyCard(this.players[player.id])

		return {
			path: path,
			roll: saveRoll
		};
	}

	addPlayerCard(player, card)
	{
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

	canBuyCard(player)
	{
		const currentPosition = this.players[player.id].position;
		let card = this.map[currentPosition];
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

		return card
	}

	buyCard(player)
	{
		let card = this.canBuyCard(player)
		if(!card)
			return false;

		player.money -= card.cost;
		this.addPlayerCard(player, card);
		return true;
	}

	removePlayerCard(player, card)
	{
		const inventoryIndex = player.inventory.indexOf(card);
		if (inventoryIndex < 0)
			return false;

		card.owner = null;
		player.inventory.splice(inventoryIndex, 1);
		if (card.group != null)
		{
			card.groupEffect = 0;
			if (player.cardGroupMap[card.group.id] != null)
			{
				const index = player.cardGroupMap[card.group.id].indexOf(card);
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

		return true;
	}

	sellCard(gamer, playerCard)
	{
		let card = this.map[playerCard.position];
		let player = this.players[gamer.id];

		if (!(card instanceof PurchaseCard) || card.owner != player)
		{
			console.log('Error on card selling');
			return -1;
		}

		if (!this.removePlayerCard(player, card))
			return false;

		player.money += card.cost;
		console.log(card.id + " card selled by player " + player.nick + " he got " + card.cost + " money");

		if (player.money > 0)
		{
			const loserIndex = this.losers.indexOf(player);
			if (loserIndex >= 0)
			{
				console.log('removing player from losser list');
				this.losers.splice(loserIndex, 1);
			}
		}

		return card.position;
	}

}

module.exports = CardMap
