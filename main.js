var socket = io('http://draftup.org:8099');

mobileAndTabletcheck = function()
{
	var check = false;
	(function(a)
	{
		if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
	})(navigator.userAgent || navigator.vendor || window.opera);
	return check;
}

window.addEventListener('DOMContentLoaded', function()
{
	var joined = false;
	var nickInput;
	var players;
	var player;
	var map;
	var currentTurn = null;
	var playersCursor = {};
	var mapGroup = null;
	var loadingGroup = null;
	var freezeGamer = false;

	var ratio = window.innerWidth > window.innerHeight ? window.innerHeight / window.innerWidth : window.innerWidth / window.innerHeight;
	ratio = mobileAndTabletcheck() ? 0.5625 : ratio;
	var game = new Phaser.Game(1600, 1600 * ratio, Phaser.AUTO, '',
	{
		preload: preload,
		create: create,
		update: update
	});

	var playerDoingMove = false;

	function LightenDarkenColor(num, amt)
	{
		var r = (num >> 16) + amt;

		if (r > 255) r = 255;
		else if (r < 0) r = 0;

		var b = ((num >> 8) & 0x00FF) + amt;

		if (b > 255) b = 255;
		else if (b < 0) b = 0;

		var g = (num & 0x0000FF) + amt;

		if (g > 255) g = 255;
		else if (g < 0) g = 0;

		return (g | (b << 8) | (r << 16));

	}

	function loadTexture(texture, callback)
	{
		if (!game.cache.checkImageKey(texture))
		{
			var loader = new Phaser.Loader(game);
			loader.image(texture, texture)
			loader.onLoadComplete.addOnce(callback);
			loader.start();
		}
		else
		{
			callback();
		}
	}

	var freezeGroup = null;

	function drawFreeze()
	{
		if (freezeGroup != null)
		{
			freezeGroup.destroy();
			freezeGroup = null;
		}

		if (!freezeGamer)
			return;

		freezeGroup = game.add.group();

		var freezeImage = game.add.sprite(game.world.centerX, game.world.centerY, 'freeze');
		freezeImage.x -= freezeImage.width / 2;
		freezeImage.y -= freezeImage.height / 2;
		freezeGroup.add(freezeImage);

		var freezeText = game.add.text(freezeImage.x, freezeImage.y + freezeImage.height, "Мы заморозили игру\n в ожидании того,\n что один из игроков разберется\n со своим отрицательным балансом.",
		{
			fontSize: '25px',
			fill: '#000',
		});
		freezeGroup.add(freezeText);
	}

	var cardGroups = [];
	var drawInventoryAligin = 0;
	var drawInventoryAliginLength = 4;
	var focusedCard = null;

	function drawInventory(align, alignLength)
	{
		drawInventoryAligin = align || drawInventoryAligin;
		drawInventoryAliginLength = alignLength || drawInventoryAliginLength;
		var workAlignLength = drawInventoryAliginLength;
		moneyText.text = player.money + "$";
		var oldCardX = 0;
		cardGroups.forEach(function(card, index)
		{
			if (!(index in player.inventory))
				card.destroy();
		});
		player.inventory.forEach(function(card, index)
		{
			if (drawInventoryAligin > 0 && index < drawInventoryAligin)
				return;
			if (drawInventoryAliginLength > 0 && workAlignLength-- <= 0)
				return;

			var visible = 1;
			if (cardGroups[index] != null)
			{
				visible = cardGroups[index].visible;
				cardGroups[index].destroy();
				delete cardGroups[index];
			}
			var cardGroup = game.add.group();
			cardGroup.visible = visible;
			cardGroups[index] = cardGroup;
			var cardImage = game.add.sprite(32, 32, 'card');
			//cardGroup.create(32, 32, 'card');
			cardGroup.scale.set(0.3, 0.3);
			//cardGroup.scale.set(0.4, 0.4);

			var color = 0xFFFFFF;
			if (card.color != null)
				color = card.color;
			else if (card.group.color != null)
				color = card.group.color;

			var graphics = game.add.graphics(45, 53);
			graphics.beginFill(color, 1);
			graphics.drawRect(30, 30, 635, 925);
			cardGroup.add(cardImage);
			cardGroup.add(graphics);

			cardImage.inputEnabled = true;
			cardImage.events.onInputDown.add(function()
			{
				focusedCard = card;
				player.inventory.forEach(function(card, index)
				{
					cardGroups[index].getBottom().loadTexture('card');
				});
				cardImage.loadTexture('card_shine');
			}, this);
			if (focusedCard != null && focusedCard.id == card.id)
			{
				focusedCard = card;
				cardImage.loadTexture('card_shine');
			}

			if (card.group != null && card.group.image.length > 0)
			{
				graphics = game.add.graphics(0, 0);
				graphics.beginFill(0xFFFFFF, 1);
				graphics.drawRect(75, 260, 635, 280);
				cardGroup.add(graphics);

				loadTexture(card.group.image, function()
				{
					var cardCoolImage = game.add.sprite(250, 260, card.group.image);
					cardCoolImage.width = 280;
					cardCoolImage.height = 280;
					cardGroup.add(cardCoolImage);
				});
			}

			var text = '';
			if (card.text.length > 0)
				text = card.text;
			else if (card.group.text.length > 0)
				text = card.group.text;
			if (text.length > 0)
			{
				var cardText = game.add.text(90, 550, text,
				{
					fontSize: '31px',
					fill: '#000',
					wordWrap: true,
					wordWrapWidth: 628
				});
				cardGroup.add(cardText);
			}

			graphics = game.add.graphics(45, 53);
			cardGroup.add(graphics);
			graphics.beginFill(LightenDarkenColor(color, 140), 1);
			graphics.drawRoundedRect(410, 60, 220, 120, 20);
			var costText = game.add.text(480, 133, card.cost,
			{
				fontSize: '64px',
				fill: '#000'
			});
			cardGroup.add(costText);

			graphics = game.add.graphics(45, 53);
			cardGroup.add(graphics);
			graphics.beginFill(LightenDarkenColor(color, 140), 1);
			graphics.drawCircle(110, 120, 100);
			var groupEffectText = game.add.text(134, 132, card.groupEffect,
			{
				fontSize: '64px',
				fill: '#000'
			});
			cardGroup.add(groupEffectText);


			if (card.penalty != null)
			{
				card.penalty.forEach(function(penalty, i)
				{
					var graphics = game.add.graphics(45, 53);
					cardGroup.add(graphics);
					graphics.beginFill(LightenDarkenColor(color, 140), 1);
					graphics.drawRoundedRect(80, 70 + 580 + (i * 58), 530, 50, 20);
					var penaltyText = game.add.text(135, 70 + 639 + (i * 58), (card.currentPenalty == i ? '> ' : '') + 'штраф ' + (i + 1) + ": " + penalty,
					{
						fontSize: '30px',
						fill: '#000'
					});
					cardGroup.add(penaltyText);
				});
			}

			var sellCardImage = game.add.sprite(600, 900, 'sell');
			sellCardImage.alpha = 0.7;
			sellCardImage.width = 128;
			sellCardImage.height = 128;
			sellCardImage.inputEnabled = true;
			sellCardImage.events.onInputDown.add(function()
			{
				socket.emit('sellcard', card);
			}, this);
			cardGroup.add(sellCardImage);


			cardGroup.y = game.world.height - cardGroup.height;
			cardGroup.x = oldCardX + cardGroup.width;
			oldCardX = cardGroup.x;
		});
	}

	var onlineGroup;
	var onlineGroupTexts = {};
	var onlineGroupTextsLastLength = 0;

	function drawOnline()
	{
		if (onlineGroupTextsLastLength > Object.keys(players).length)
		{
			onlineGroup.destroy();
			onlineGroup = null;
			onlineGroupTexts = {};
		}
		if (onlineGroup == null)
		{
			onlineGroup = game.add.group();
			onlineGroup.alpha = 0.7;
			var graphics = game.add.graphics(game.world.width - 260, 30);
			onlineGroup.add(graphics);
			graphics.beginFill(0x000000, 1);
			graphics.drawRoundedRect(0, 0, 250, 300, 25);
		}
		var i = 0;
		for (var id in players)
		{
			var text = (currentTurn != null && currentTurn.id == id ? '> ' : '') + players[id].nick + ' - ' + players[id].money + "$" + " - карт: " + players[id].inventory.length;
			if (onlineGroupTexts[id] == null)
			{
				onlineGroupTexts[id] = game.add.text(game.world.width - 245, 50 + i * 40, text,
				{
					fontSize: '18px',
					fill: '#fff'
				});
				onlineGroup.add(onlineGroupTexts[id]);
			}
			else
				onlineGroupTexts[id].text = text;

			i++;
		}
		onlineGroupTextsLastLength = Object.keys(players).length;
	}

	var cardInfoGroup;

	function drawCardInfo()
	{
		if (cardInfoGroup != null)
		{
			cardInfoGroup.destroy();
			cardInfoGroup = null;
		}
		cardInfoGroup = game.add.group();
		cardInfoGroup.alpha = 0.7;
		var graphics = game.add.graphics(game.world.width - 260, 350);
		cardInfoGroup.add(graphics);
		graphics.beginFill(0x000000, 1);
		graphics.drawRoundedRect(0, 0, 250, 100, 25);
		graphics.endFill();

		if (map[player.position].cost > 0)
		{
			var cardCost = game.add.text(game.world.width - 245, 364, "Эта карта стоит: " + map[player.position].cost,
			{
				fontSize: '18px',
				fill: '#fff'
			});
			cardInfoGroup.add(cardCost);
		}

		//if(map[player.position].owner != null)
		//{
		//	var cardOwner = game.add.text(game.world.width - 245, 400, "Её владелец: " + players[map[player.position].owner].nick, { fontSize: '18px', fill: '#fff' });
		//	cardInfoGroup.add(cardOwner);
		//}
		if (map[player.position].description.length > 0)
		{
			var descText = game.add.text(game.world.width - 245, 390, map[player.position].description,
			{
				fontSize: '12px',
				fill: '#fff',
				wordWrap: true,
				wordWrapWidth: 245
			});
			cardInfoGroup.add(descText);
		}


	}

	function counterPlayerCordModMain(x, y, width, height, length, index)
	{
		var power = Math.ceil(Math.sqrt(length));
		return {
			x: (x + (width / (power + 1)) * ((index % power) + 1)),
			y: (y + (height / ((length / power) + 1)) * (((index / power) | 0) + 1))
		};
	}

	function counterPlayerCordMod(card, index)
	{
		if (index.id != null)
			index = card.mapPlayers.indexOf(index.id);
		return counterPlayerCordModMain(card.x, card.y, card.width, card.height, card.mapPlayers.length, index);
	}

	var playersColorsNum = 0;
	var playersColors = [
		0xE80510,
		0xBB05E8,
		0x0532E8,
		0xE88605,
		0x10E805,
		0x0598E8
	];
	var playersColorsMap = {};

	function addMapColor(id)
	{
		playersColorsMap[id] = {
			color: playersColors[playersColorsNum],
			num: playersColorsNum
		};

		if (playersColorsNum + 1 < playersColors.length)
			playersColorsNum++;
		else
			playersColorsNum = 0;
	}

	function removeMapColor(id)
	{
		delete playersColorsMap[id];
	}
	var cellBounds = [];

	function drawCellBounds(i)
	{
		if (cellBounds[i] != null)
			cellBounds[i].destroy();

		cellBounds[i] = game.add.graphics(0, 0);
		if (map[i].owner == null)
			cellBounds[i].lineStyle(1, 0xDDDDDD, 1);
		else
			cellBounds[i].lineStyle(2, playersColorsMap[map[i].owner].color, 1);

		cellBounds[i].drawRect(map[i].x, map[i].y, map[i].width, map[i].height);
		mapGroup.add(cellBounds[i]);
	}

	function drawMap()
	{
		if (mapGroup != null)
		{
			mapGroup.destroy();
			mapGroup = null;
		}
		mapGroup = game.add.group();
		var promise = new Promise(function(resolve, reject)
		{
			var loaderCounter = 0;

			function cellImage(image, cell)
			{
				loaderCounter++;
				loadTexture(image, function()
				{
					var cardCoolImage = game.add.sprite(map[cell].x, map[cell].y, image);
					cardCoolImage.width = map[cell].width;
					cardCoolImage.height = map[cell].height;
					mapGroup.add(cardCoolImage);

					if (cell + 1 < map.length)
						loadCell(cell + 1);

					loaderCounter--;
					if (loaderCounter == 0)
					{
						resolve();
					}
				});
			}

			function loadCell(i)
			{
				if (map[i].needFill)
				{
					var fill = game.add.graphics(0, 0);
					fill.beginFill(map[i].fillColor, 1);
					fill.drawRect(map[i].x, map[i].y, map[i].width, map[i].height);
					fill.endFill();
					mapGroup.add(fill);
				}

				if (map[i].image.length > 0)
				{
					cellImage(map[i].image, i);
				}
				else if (map[i].group != null && map[i].group.image.length > 0)
				{
					cellImage(map[i].group.image, i);
				}
				else if (i + 1 < map.length)
				{
					loadCell(i + 1);
				}
				else if (loaderCounter == 0)
				{
					resolve();
				}
			}
			loadCell(0);
		});
		promise.then(function()
		{
			for (var i = 0; i < map.length; i++)
			{
				if (map[i].cost > 0)
				{
					var costText = game.add.text(map[i].x + map[i].width / 2 - 23, map[i].y + map[i].height / 2 - 10, map[i].cost,
					{
						fontSize: '20px',
						fill: '#000'
					});
					mapGroup.add(costText);
					costText.alpha = 0.5;
				}

				drawCellBounds(i);

				map[i].mapPlayers.forEach(function(gamer, index)
				{
					var newCord = counterPlayerCordMod(map[i], index);

					playersCursor[gamer] = game.add.sprite(newCord.x, newCord.y, 'fishka_' + playersColorsMap[gamer].num);
					playersCursor[gamer].x -= playersCursor[gamer].width / 2;
					playersCursor[gamer].y -= playersCursor[gamer].height / 2;
					mapGroup.add(playersCursor[gamer]);
				});
			}
		});
	}

	socket.on('join', function(data)
	{
		nickInput.destroy();
		var moneyBag = game.add.sprite(0, game.world.height - 130, 'bag');
		moneyText = game.add.text(10, game.world.height - 70, '0$',
		{
			fontSize: '25px',
			fill: '#000'
		});

		stepButton = game.add.button(game.world.width - 100, game.world.height - 100, 'next', function()
		{
			if (freezeGamer)
				return;

			if (!playerDoingMove)
				socket.emit('makestep');
		}, this, 2, 1, 0);
		stepButton.width = 80;
		stepButton.height = 80;

		buyButton = game.add.button(game.world.width - 180, game.world.height - 100, 'buy', function()
		{
			if (freezeGamer)
				return;

			socket.emit('buycard');
		}, this, 2, 1, 0);
		buyButton.width = 80;
		buyButton.height = 80;

		buttonHideCards = game.add.button(game.world.width - 250, game.world.height - 50, 'down', function()
		{
			cardGroups.forEach(function(card)
			{
				if (card.visible == 0)
					card.visible = 1;
				else
					card.visible = 0;
			});
		}, this, 2, 1, 0);
		buttonHideCards.width = 50;
		buttonHideCards.height = 50;

		buttonLeftCards = game.add.button(120, game.world.height - 50, 'left', function()
		{
			if (drawInventoryAligin > 0)
			{
				drawInventoryAligin--;
				drawInventory();
			}
		}, this, 2, 1, 0);
		buttonLeftCards.width = 50;
		buttonLeftCards.height = 50;

		buttonRightCards = game.add.button(game.world.width - 330, game.world.height - 50, 'right', function()
		{
			if (drawInventoryAligin < player.inventory.length - drawInventoryAliginLength)
			{
				drawInventoryAligin++;
				drawInventory();
			}
		}, this, 2, 1, 0);
		buttonRightCards.width = 50;
		buttonRightCards.height = 50;

		players = data.map.players;
		player = data.player;
		map = data.map.map;
		console.log('Me with id ' + data.player.id + ' joined');
		console.log(map);

		drawInventory();
		drawOnline();
		// detect color map
		for (id in players)
		{
			addMapColor(id);
		}
		drawMap();
		drawCardInfo();

		socket.on('joinplayer', function(data)
		{
			console.log('Player ' + data.player.id + ' join');
			map = data.map.map;
			players = data.map.players;
			addMapColor(data.player.id);
			drawMap();
			drawOnline();
		});

		socket.on('leftplayer', function(data)
		{
			console.log('Player ' + data.player.id + ' left');
			delete players[data.player.id];
			if (playersCursor[data.player.id] != null)
			{
				playersCursor[data.player.id].destroy();
				delete playersCursor[data.player.id];
			}
			removeMapColor(data.player.id);
			drawOnline();
		});

		socket.on('makestep', function(data)
		{
			map = data.map.map;
			players = data.map.players;
			if (data.player.id == player.id)
			{
				player = data.player;
			}
			if (data.map.losers.length > 0)
			{
				freezeGamer = true;
			}

			playersCursor[data.player.id].movePoints = data.path;
			currentTurn = data.turn;
			if (currentTurn.id != data.player.id && loadingGroup != null)
			{
				loadingGroup.destroy();
				loadingGroup = null;
			}
			playerDoingMove = true;
		});

		socket.on('buycard', function(data)
		{
			players = data.players;
			if (data.player.id == player.id)
			{
				player = data.player;
			}
			if (data.result)
			{
				if (data.player.id == player.id)
				{
					if (player.inventory.length - drawInventoryAliginLength > 0)
						drawInventoryAligin = player.inventory.length - drawInventoryAliginLength;
					cardGroups.forEach(function(card)
					{
						card.visible = 1;
					});
				}

				map[data.player.position] = data.cell;
				drawCellBounds(data.player.position);
				drawInventory();
				drawOnline();
			}
		});

		socket.on('sellcard', function(data)
		{
			players = data.players;
			if (data.player.id == player.id)
			{
				player = data.player;
			}
			if (freezeGamer && data.losers.length == 0)
			{
				freezeGamer = false;
				drawFreeze();
			}
			if (data.result)
			{
				if (data.player.id == player.id)
				{
					if (player.inventory.length - drawInventoryAliginLength > 0)
						drawInventoryAligin = player.inventory.length - drawInventoryAliginLength;
					cardGroups.forEach(function(card)
					{
						card.visible = 1;
					});
				}

				map[data.cell.position] = data.cell;
				drawCellBounds(data.cell.position);
				drawInventory();
				drawOnline();
				drawCardInfo();
			}
		});
	});

	function preload()
	{
		game.load.image('background', 'images/background.jpg');
		game.load.spritesheet('loading', 'images/pikachu.png', 232, 227, 7);
		game.load.image('freeze', 'images/freeze.png');

		game.load.image('card', 'images/card.png');
		game.load.image('card_shine', 'images/card_shine.png');
		game.load.image('sell', 'images/sell.png');

		game.load.image('next', 'images/next.png');
		game.load.image('buy', 'images/buy.png');
		game.load.image('bag', 'images/bag.png');
		game.load.image('down', 'images/down.png');
		game.load.image('right', 'images/right.png');
		game.load.image('left', 'images/left.png');

		game.load.image('fishka_0', 'images/fishka/fishka_red.png');
		game.load.image('fishka_1', 'images/fishka/fishka_purple.png');
		game.load.image('fishka_2', 'images/fishka/fishka_blue.png');
		game.load.image('fishka_3', 'images/fishka/fishka_orange.png');
		game.load.image('fishka_4', 'images/fishka/fishka_green.png');
		game.load.image('fishka_5', 'images/fishka/fishka_ocean.png');
	}

	function create()
	{
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		var background = game.add.image(0, 0, 'background');
		//var backgroundRatio = background.width/background.height

		game.add.plugin(Fabrique.Plugins.InputField);
		nickInput = game.add.inputField(game.world.centerX, game.world.centerY,
		{
			font: '36px Arial',
			fill: '#666666',
			fontWeight: 'bold',
			width: 350,
			height: 45,
			padding: 8,
			borderWidth: 1,
			borderColor: '#000',
			borderRadius: 6,
			placeHolder: 'Your Nick',
		});
		nickInput.x -= nickInput.width / 2;
		nickInput.y -= nickInput.height / 2;

		game.input.keyboard.onDownCallback = function(e)
		{
			if (e.keyCode == 13 && !joined && nickInput.text.text.length > 0)
			{
				joined = true;
				socket.emit('join',
				{
					nick: nickInput.text.text
				});
			}
		};
	}

	var waitPlayerCursorOnPoint = 1;

	function update()
	{
		if (playerDoingMove)
		{
			var findMovePoint = false;
			for (var id in playersCursor)
			{
				if (playersCursor[id].movePoints != null && playersCursor[id].movePoints.length > 0)
				{
					findMovePoint = true;
					var point = playersCursor[id].movePoints[0];
					// Изменяем расположение курсора для последней точки на реальное
					var movePoint = {
						x: map[point].x + map[point].width / 2,
						y: map[point].y + map[point].height / 2
					};
					if (playersCursor[id].movePoints.length == 1)
					{
						movePoint = counterPlayerCordMod(map[point], players[id]);
					}
					movePoint.x -= playersCursor[id].width / 2;
					movePoint.y -= playersCursor[id].height / 2;
					game.world.bringToTop(playersCursor[id]);
					waitPlayerCursorOnPoint--;
					if (playersCursor[id].x - movePoint.x > 0 && waitPlayerCursorOnPoint <= 0)
					{
						playersCursor[id].x -= 4;
					}

					if (-(playersCursor[id].x - movePoint.x) > 0 && waitPlayerCursorOnPoint <= 0)
					{
						playersCursor[id].x += 4;
					}

					if (playersCursor[id].y - movePoint.y > 0 && waitPlayerCursorOnPoint <= 0)
					{
						playersCursor[id].y -= 4;
					}

					if (-(playersCursor[id].y - movePoint.y) > 0 && waitPlayerCursorOnPoint <= 0)
					{
						playersCursor[id].y += 4;
					}
					if (Math.abs(playersCursor[id].x - movePoint.x) < 4 && Math.abs(playersCursor[id].y - movePoint.y) < 4)
					{
						playersCursor[id].movePoints.shift();
						waitPlayerCursorOnPoint = 25;
					}
				}
			}
			if (!findMovePoint)
			{
				drawInventory();
				drawOnline();
				drawCardInfo();
				playerDoingMove = false;

				if (currentTurn.id == player.id)
				{
					if (loadingGroup != null)
					{
						loadingGroup.destroy();
						loadingGroup = null;
					}
					loadingGroup = game.add.group();
					var loading = game.add.sprite(game.world.width - 550, 30, 'loading');
					loading.animations.add('spin');
					loading.animations.play('spin', 7, true);
					loadingGroup.add(loading);
					var loadingText = game.add.text(game.world.width - 550, 250, 'Пикачу крутится\n и ожидает вашего хода',
					{
						fontSize: '20px',
						fill: '#000'
					});
					loadingGroup.add(loadingText);
				}

				if (freezeGamer)
				{
					drawFreeze();
				}
			}
		}


	}

});