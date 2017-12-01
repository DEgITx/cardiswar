var socket = io(document.location.protocol + '//' + document.location.hostname + (PRODUCTION ? '/' : ':8099/'));

window.addEventListener('DOMContentLoaded', function()
{
	var joined = false;
	var nickInput;
	var nickEnterButton;
	let appLogo;
	var players;
	var player;
	var map;
	var currentTurn = null;
	var playersCursor = {};
	var mapGroup = null;
	var loadingGroup = null;
	var freezeGamer = false;
	var cursors;
	let spectator = false;

	let gameState = {
		preload: preload,
		create: create,
		update: update,
		render: render,
	}
	let game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.CANVAS, '');
	game.state.add('game', gameState)

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

	function fixHideShow(proxy)
	{
		proxy.hide = () =>
		{
			console.log('hidding')
			if(proxy.height > 0)
			{
				proxy.realHeight = proxy.height
				proxy.height = 0
			}
		}

		proxy.show = () => {
			if(proxy.realHeight)
			{
				proxy.height = proxy.realHeight
				delete proxy.realHeight;
			}
		}

		proxy.hideShow = () => {
			if(proxy.realHeight)
				proxy.show()
			else
				proxy.hide()
		}

		proxy.hidden = () => !!proxy.realHeight
		proxy.setVisible = (visible) => visible ?  proxy.show() : proxy.hide()

		return proxy
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

		var freezeImage = game.add.sprite(game.camera.width / 2, game.camera.height / 2, 'freeze');
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
	var focusedCard;
	var focusedCardIndex;

	function drawInventory(align, alignLength)
	{
		// изменение денег
		if(typeof moneyText !== 'undefined' && moneyText)
		{
			moneyText.text = player.money + "$";
			moneyDiff = player.money - playerMoney;
			playerMoney = player.money;
			console.log(moneyDiff)
			if(moneyDiff !== 0)
				showMoneyDiff = true
		}
		
		const offsetX = 120;
		const cardsAvaliableWidth = game.camera.width - offsetX - 90;
		// for height mod
		let cardsAvaliableHeight = game.camera.height;
		if(player.inventory.length < 5)
			cardsAvaliableHeight /= 2;
		
		
		cardGroups.forEach(function(card, index)
		{
			if (!(index in player.inventory))
				card.destroy();
		});
		player.inventory.forEach(function(card, index)
		{
			let visible = 1;
			if (cardGroups[index] != null)
			{
				visible = !cardGroups[index].hidden();
				cardGroups[index].destroy();
				delete cardGroups[index];
			}
			let cardGroup = fixHideShow(game.add.group());
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
				player.inventory.forEach(function(card, index)
				{
					cardGroups[index].getBottom().loadTexture('card');
				});
				if(!focusedCard || focusedCardIndex !== index)
				{
					focusedCard = card;
					focusedCardIndex = index;
					cardImage.loadTexture('card_shine');
				}
				else
				{
					focusedCard = undefined;
					focusedCardIndex = undefined;
				}
				drawInventory()
			}, this);
			if (focusedCard != null && focusedCard.id == card.id)
			{
				focusedCard = card;
				cardImage.loadTexture('card_shine');
			}

			var image;
			if (card.image.length > 0)
				image = card.image;
			else if (card.group != null && card.group.image.length > 0)
				image = card.group.image;

			if (image != null)
			{
				graphics = game.add.graphics(0, 0);
				graphics.beginFill(0xFFFFFF, 1);
				graphics.drawRect(75, 260, 635, 280);
				cardGroup.add(graphics);

				loadTexture(image, function()
				{
					var cardCoolImage = game.add.sprite(250, 260, image);
					cardCoolImage.width = 280;
					cardCoolImage.height = 280;
					cardGroup.add(cardCoolImage);
				});
			}

			if (card.group != null)
			{
				graphics = game.add.graphics(45, 53);
				cardGroup.add(graphics);
				graphics.beginFill(LightenDarkenColor(color, 140), 1);
				graphics.drawCircle(110, 120, 100);
				var groupPowerText = game.add.text(134, 132, card.groupPower,
				{
					fontSize: '64px',
					fill: '#000'
				});
				cardGroup.add(groupPowerText);
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

			if (card.cost != null)
			{
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

			}

			if(card.usable)
			{
				var sellCardImage = game.add.sprite(450, 80, 'use');
				sellCardImage.width /= 2.8;
				sellCardImage.height /= 2.8;
				sellCardImage.inputEnabled = true;
				sellCardImage.events.onInputDown.add(function()
				{
					socket.emit('useCard', card);
				}, this);
				cardGroup.add(sellCardImage);
			}

			cardGroup.fixedToCamera = true;

			// card x,y
			if(cardsAvaliableWidth >= cardGroup.width * 1.5)
			{
				cardGroup.cameraOffset.y = game.camera.height - cardGroup.height;
				if(cardsAvaliableWidth > player.inventory.length * cardGroup.width)
				{
					cardGroup.cameraOffset.x = index * cardGroup.width;
				}
				else
				{
					const changeX = (cardsAvaliableWidth - cardGroup.width) / player.inventory.length;
					cardGroup.cameraOffset.x = index * changeX;
					if(typeof focusedCardIndex !== 'undefined')
						if(index > focusedCardIndex)
							cardGroup.cameraOffset.x += cardGroup.width - changeX;
				}
				cardGroup.cameraOffset.x += offsetX;
			}
			else
			{
				cardGroup.cameraOffset.x += offsetX;
				const changeY = (cardsAvaliableHeight - cardGroup.height) / player.inventory.length;
				cardGroup.cameraOffset.y = game.camera.height - cardGroup.height
				cardGroup.cameraOffset.y -= index * changeY;
				if(typeof focusedCardIndex !== 'undefined')
					if(index > focusedCardIndex)
						cardGroup.cameraOffset.y -= cardGroup.height - changeY;
			}

			cardGroup.setVisible(visible);
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
			var graphics = game.add.graphics(game.camera.width - 260, 30);
			onlineGroup.add(graphics);
			graphics.beginFill(0x000000, 1);
			graphics.drawRoundedRect(0, 0, 250, 300, 25);
			graphics.fixedToCamera = true;
		}
		var i = 0;
		for (var id in players)
		{
			var text = (currentTurn != null && currentTurn.id == id ? '> ' : '') + players[id].nick + ' - ' + players[id].money + "$" + " - карт: " + players[id].inventory.length;
			if (onlineGroupTexts[id] == null)
			{
				onlineGroupTexts[id] = game.add.text(game.camera.width - 245, 50 + i * 40, text,
				{
					fontSize: '18px',
					fill: '#fff'
				});
				onlineGroupTexts[id].fixedToCamera = true;
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
		cardInfoGroup.fixedToCamera = true;
		cardInfoGroup.alpha = 0.7;
		var graphics = game.add.graphics(game.camera.width - 260, 350);
		cardInfoGroup.add(graphics);
		graphics.beginFill(0x000000, 1);
		graphics.drawRoundedRect(0, 0, 250, 100, 25);
		graphics.endFill();

		if (map[player.position].cost > 0)
		{
			var cardCost = game.add.text(game.camera.width - 245, 364, "Эта карта стоит: " + map[player.position].cost,
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
			var descText = game.add.text(game.camera.width - 245, 390, map[player.position].description,
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
		return new Promise((mapResolve) =>
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
				// расширяем границы мира
				if (game.world.width < map[i].x + map[i].width + 400)
				{
					console.log('resize world to ' + (map[i].x + map[i].width + 400) + 'x' + game.world.height);
					game.world.setBounds(0, 0, map[i].x + map[i].width + 400, game.world.height);
				}
				if (game.world.height < map[i].y + map[i].height + 400)
				{
					console.log('resize world to ' + game.world.width + 'x' + (map[i].y + map[i].height + 400));
					game.world.setBounds(0, 0, game.world.width, map[i].y + map[i].height + 400);
				}

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

				mapResolve()
			}
		});
		});
	}

	function showMyTurn()
	{
		console.log(currentTurn, player.id)
		if (currentTurn == player.id)
		{
			if (loadingGroup != null)
			{
				loadingGroup.destroy();
				loadingGroup = null;
			}
			loadingGroup = game.add.group();
			var loading = game.add.sprite(game.camera.width / 2, game.camera.height / 2, 'loading');
			loading.x -= loading.width / 2;
			loading.y -= loading.height / 2;
			loading.animations.add('spin');
			loading.animations.play('spin', 7, true);
			loadingGroup.add(loading);
			var loadingText = game.add.text(game.camera.width / 2, game.camera.height / 2 + loading.height / 2 + 20, 'Пикачу крутится\n и ожидает вашего хода',
			{
				fontSize: '20px',
				fill: '#000'
			});
			loadingText.x -= loadingText.width / 2;
			loadingText.y -= loadingText.height / 2;
			loadingGroup.add(loadingText);
			loadingGroup.fixedToCamera = true;
			loadingGroup.alpha = 0.5
		}
	}

	let onJoin = async (data) => {
		game.kineticScrolling.start();

		const buyCardAction = () => {
			if (freezeGamer)
				return;

			socket.emit('buycard');
		}

		if(!spectator)
		{
			playerMoney = data.player.money
			var moneyBag = game.add.button(0, game.camera.height - 160, 'bag', buyCardAction, this, 2, 1, 0);
			moneyBag.width /= 5;
			moneyBag.height /= 5;
			moneyBag.fixedToCamera = true;
			moneyText = game.add.text(15, game.camera.height - 73, '0$',
			{
				fontSize: '25px',
				fill: '#000'
			});
			moneyText.fixedToCamera = true;
		}

		players = data.map.players;
		player = data.player;
		map = data.map.map;
		console.log('Me with id ' + data.player.id + ' joined');
		console.log(map);

		// detect color map
		for (id in players)
		{
			addMapColor(id);
		}
		await drawMap();
		drawInventory();
		drawOnline();
		if(!spectator)
			drawCardInfo();

		function checkTurn(data)
		{
			currentTurn = data.turn;
			if (currentTurn !== player.id && loadingGroup != null)
			{
				loadingGroup.destroy();
				loadingGroup = null;
			}
		}

		if(!spectator)
		{
			buyButton = game.add.button(game.camera.width - 106, game.camera.height - 205, 'buy', buyCardAction, this, 2, 1, 0);
			buyButton.width = 80;
			buyButton.height = 80;
			buyButton.fixedToCamera = true;

			buttonShowCards = game.add.button(game.camera.width - 90, game.camera.height - 260, 'down', function()
			{
				cardGroups.forEach((card) => card.hideShow())
			}, this, 2, 1, 0);
			buttonShowCards.width = 50;
			buttonShowCards.height = 50;
			buttonShowCards.fixedToCamera = true;

			rollDice = game.add.button(game.camera.width - 120, game.camera.height - 120, 'dice_2', function()
			{
				if (freezeGamer)
					return;
	
				if (!playerDoingMove)
					socket.emit('makestep');
			}, this, 2, 1, 0);
			rollDice.width = 110;
			rollDice.height = 110;
			rollDice.fixedToCamera = true;
	
			checkTurn(data)
			showMyTurn()
		}

		socket.on('joinedPlayer', function(data)
		{
			console.log('Player ' + data.player.id + ' join');
			map = data.map.map;
			players = data.map.players;
			addMapColor(data.player.id);
			if(!spectator)
			{
				checkTurn(data)
				showMyTurn()
			}
			drawMap();
			drawOnline();
			joinSound.play()
		});

		socket.on('leftedPlayer', function(data)
		{
			console.log('Player ' + data.player.id + ' left');
			delete players[data.player.id];
			if (playersCursor[data.player.id] != null)
			{
				playersCursor[data.player.id].destroy();
				delete playersCursor[data.player.id];
			}
			removeMapColor(data.player.id);
			if(!spectator)
			{
				checkTurn(data)
				showMyTurn()
			}
			drawOnline();
			leftSound.play()
		});

		socket.on('makestep', function(data)
		{
			map = data.map.map;
			players = data.map.players;
			if (data.player.id == player.id)
			{
				if(player.money > data.player.money)
					needFineSound = true;

				player = data.player;
			}
			if (data.map.losers.length > 0)
			{
				freezeGamer = true;
			}

			playersCursor[data.player.id].movePoints = data.path;
			if(data.path.length > 0)
				firstStep = true;

			if(!spectator)
				checkTurn(data)
			playerDoingMove = true;
			if(typeof rollDice !== 'undefined' && data.roll > 0)
				rollDice.loadTexture('dice_' + data.roll);
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
					cardGroups.forEach(function(card)
					{
						card.show()
					});
				}

				map[data.player.position] = data.cell;
				drawCellBounds(data.player.position);
				drawInventory();
				drawOnline();
				buySound.play()
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
					cardGroups.forEach(function(card)
					{
						card.show()
					});
				}

				map[data.cell.position] = data.cell;
				drawCellBounds(data.cell.position);
				drawInventory();
				drawOnline();
				if(!spectator)
					drawCardInfo();

				sellSound.play()
			}
		});

		socket.on('useCard', ({player: p, data}) => {
			if(p.id === player.id)
				player = p;

			if(data && data.map)
			{
				map = data.map
				drawMap();
			}
			drawOnline();
			drawInventory();
		})
	}

	let startJoin = (data, spectr) => 
	{
		console.log('loading')
		appLogo.destroy()
		nickInput.destroy();
		nickEnterButton.destroy()
		stickerJoinGroup.destroy()
		let text = game.add.text(game.camera.width/2 - 120, game.camera.height/2, 'Loading game data... it can take a little time...',
		{
			fontSize: '18px',
			fill: '#000'
		});
		setTimeout(async () => {
			game.lockRender = true;
			spectator = spectr
			await onJoin(data)
			game.lockRender = false;
			text.destroy()
			console.log('loaded')
		}, 20)
	}

	socket.on('join', (data) => startJoin(data, false));
	socket.on('joinSpectator', (data) => startJoin(data, true));

	function preload()
	{
		if(!PRODUCTION)
			game.time.advancedTiming = true;
	}

	function resources()
	{
		// loading screen
		game.load.spritesheet('loading', 'images/pikachu.png', 232, 227, 7);
		game.load.image('freeze', 'images/freeze.png');
		game.load.image('start', 'images/start.png');
		game.load.image('logo', 'images/logo.png');
		
		game.load.image('sticker', 'images/sticker.png');
		game.load.image('join', 'images/join.png');
		game.load.image('spectate', 'images/spectate.png');

		game.load.image('card', 'images/card.png');
		game.load.image('card_shine', 'images/card_shine.png');
		game.load.image('sell', 'images/sell.png');
		game.load.image('use', 'images/use.png');

		game.load.image('buy', 'images/buy.png');
		game.load.image('bag', 'images/bag.png');
		game.load.image('down', 'images/down.png');

		game.load.image('fishka_0', 'images/fishka/fishka_red.png');
		game.load.image('fishka_1', 'images/fishka/fishka_purple.png');
		game.load.image('fishka_2', 'images/fishka/fishka_blue.png');
		game.load.image('fishka_3', 'images/fishka/fishka_orange.png');
		game.load.image('fishka_4', 'images/fishka/fishka_green.png');
		game.load.image('fishka_5', 'images/fishka/fishka_ocean.png');

		game.load.image('dice_1', 'images/dice/1.png');
		game.load.image('dice_2', 'images/dice/2.png');
		game.load.image('dice_3', 'images/dice/3.png');
		game.load.image('dice_4', 'images/dice/4.png');
		game.load.image('dice_5', 'images/dice/5.png');
		game.load.image('dice_6', 'images/dice/6.png');	

		// audio
		game.load.audio('step', 'sounds/step.wav');
		game.load.audio('buy', 'sounds/buy.wav');
		game.load.audio('left', 'sounds/left.wav');
		game.load.audio('join', 'sounds/join.wav');
		game.load.audio('sell', 'sounds/sell.wav');
		game.load.audio('fine', 'sounds/fine.wav');
	}

	const loadingScreenState = {
		preload: () => {
			game.load.image('background', 'images/background.jpg');
		},
		create: () => {
			game.state.start('loading')
		}
	}
	const loading = {
		preload: () => {
			var background = game.add.image(0, 0, 'background')
			let text = game.add.text(game.camera.width/2, game.camera.height/2, 'Loading game...',
			{
				fontSize: '18px',
				fill: '#000'
			});
			text.x -= text.width/2;

			resources()
		},
		create: () => game.state.start('game')
	}
	game.state.add('loadingScreen', loadingScreenState)
	game.state.add('loading', loading)
	game.state.start('loadingScreen')
	

	function create()
	{
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.add.plugin(PhaserInput.Plugin);
		game.kineticScrolling = game.plugins.add(Phaser.Plugin.KineticScrolling);
		game.kineticScrolling.configure(
		{
			kineticMovement: true,
			timeConstantScroll: 325, //really mimic iOS
			horizontalScroll: true,
			verticalScroll: true,
			horizontalWheel: true,
			verticalWheel: false,
			deltaWheel: 40
		});

		var background = game.add.image(0, 0, 'background');

		nickInput = game.add.inputField(game.camera.width / 2, game.camera.height / 2,
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

		const startLogin = (session) => {
			if (!joined && nickInput.text.text.length > 0)
			{
				joined = true;
				console.log('join')
				socket.emit('join',
				{
					nick: nickInput.text.text,
					session: session
				});
			}
		}

		nickEnterButton = game.add.button(nickInput.x + nickInput.width + 25, game.camera.height / 2, 'start', () => startLogin(), this, 2, 1, 0);
		nickEnterButton.y -= nickEnterButton.height / 2;

		appLogo = game.add.button(game.camera.width / 2, game.camera.height / 2, 'logo', () => startLogin(), this, 2, 1, 0);
		appLogo.width = 300;
		appLogo.height = 300;

		appLogo.x -= appLogo.width / 2;
		console.log(nickInput.height / 2)
		appLogo.y -= appLogo.height + nickInput.height / 2;

		nickInput.x -= nickEnterButton.width / 2 + 12
		nickEnterButton.x -= nickEnterButton.width / 2 + 12
		appLogo.x -= nickEnterButton.width / 2 + 12

		nickInput.y -= 10
		nickEnterButton.y -= 10
		appLogo.y -= 10

		game.input.keyboard.onDownCallback = function(e)
		{
			if (e.keyCode == 13)
			{
				startLogin()
			}
		};

		cursors = game.input.keyboard.createCursorKeys();

		stickerJoinGroup = game.add.group()
		socket.emit('sessions', ({sessions, maxPlayers}) => {
			let drawSession = () => {
				if(joined)
					return;

				if(stickerJoinGroup)
				{
					stickerJoinGroup.destroy()
					stickerJoinGroup = game.add.group()
				}

				let offsetX = 0, offsetY = game.camera.height / 2 + 60;
				for(let sessionId = 0; sessionId < sessions.length; sessionId++)
				{
					const session = sessions[sessionId]
					if(!session)
						continue;
	
					let sticker = game.add.sprite(offsetX, offsetY, 'sticker')
					stickerJoinGroup.add(sticker)
					sticker.width /= 3;
					sticker.height /= 3;
					
					let stickerTextGroup = game.add.group()
	
					if(session.players)
					{
						let nickOffsetY = 0;
						let i=1;
						for(let player of session.players)
						{
							let nickText = game.add.text( 13, 17 + nickOffsetY, `${i++}. ${player.nick}`,
							{
								fontSize: '16px',
								fill: '#000'
							})
							stickerTextGroup.add(nickText)
							nickOffsetY += nickText.height + 1;
						}
					}
					stickerTextGroup.rotation -= 0.05
					stickerTextGroup.x = sticker.x
					stickerTextGroup.y = sticker.y
	
					if(session.players.length < maxPlayers)
					{
						let joinButton = game.add.button(sticker.width / 2 + 20, 17 + sticker.height, 'join', () => startLogin(sessionId), this, 2, 1, 0);
						joinButton.width /= 9;
						joinButton.height /= 9;
						joinButton.x -= joinButton.width /2;
						joinButton.y -= joinButton.height + 30;
						stickerTextGroup.add(joinButton)
					}
	
					let spectateButton = game.add.button(30, 17 + sticker.height, 'spectate', () => {
						if (!joined)
						{
							joined = true;
							socket.emit('spectate', sessionId);
						}
					}, this, 2, 1, 0);
					spectateButton.width /= 8;
					spectateButton.height /= 8;
					spectateButton.x -= spectateButton.width /2;
					spectateButton.y -= spectateButton.height + 20;
					stickerTextGroup.add(spectateButton)
	
	
					stickerJoinGroup.add(stickerTextGroup)
					
					offsetX += sticker.width
					if(offsetX + sticker.width >= game.camera.width)
					{
						offsetY += sticker.height
						offsetX = 0
					}
				}
			}
			drawSession()
			socket.on('joinedPlayer', function({player})
			{
				const { session } = player;
				if(sessions[session])
					sessions[session].players.push(player)
				else
					sessions[session] = { players: [player], spectators: [] }
				drawSession();
			});
			socket.on('leftedPlayer', function({player})
			{
				const { session } = player;
				if(!sessions[session])
					return;

				sessions[session].players = sessions[session].players.filter(p => p.id !== player.id)
				if(sessions[session].players.length === 0)
					delete sessions[session]

				drawSession();
			});
		});

		buySound = game.add.audio('buy');
		stepSound = game.add.audio('step');
		leftSound = game.add.audio('left');
		joinSound = game.add.audio('join');
		sellSound = game.add.audio('sell');
		fineSound = game.add.audio('fine');
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
						
						if(typeof needFineSound !== 'undefined' && needFineSound && playersCursor[id].movePoints.length === 0)
						{
							fineSound.play()
							needFineSound = false
						}
						else
						if(!firstStep)
							stepSound.play()
						firstStep = false
					}
				}
			}
			if (!findMovePoint)
			{
				drawInventory();
				drawOnline();
				if(!spectator)
					drawCardInfo();
				playerDoingMove = false;

				if(!spectator)
				{
					showMyTurn()
					buyButton.visible = player.canBuyCard;
				}

				if (freezeGamer)
				{
					drawFreeze();
				}
			}
		}

		if(typeof showMoneyDiff !== 'undefined' && showMoneyDiff)
		{
			if(typeof moneyTextUp === 'undefined')
			{
				moneyTextUp = game.add.text(moneyText.x, moneyText.y, moneyDiff + '$',
				{
					fontSize: '25px',
					fill: moneyDiff > 0 ? 'green' : 'red'
				});
			}
			if(moneyTextUp.alpha > 0)
			{
				moneyTextUp.alpha -= 0.012
				if(moneyTextUp.alpha < 0)
					moneyTextUp.alpha = 0;

				moneyTextUp.y -= 2;
				
				moneyTextUp.scale.x += 0.01;
				moneyTextUp.scale.y += 0.01;
			}
			else
			{
				moneyTextUp.destroy()
				moneyTextUp = undefined
				showMoneyDiff = false;
			}
		}

		if (cursors.up.isDown)
		{
			game.camera.y -= 5;
		}
		else if (cursors.down.isDown)
		{
			game.camera.y += 5;
		}

		if (cursors.left.isDown)
		{
			game.camera.x -= 5;
		}
		else if (cursors.right.isDown)
		{
			game.camera.x += 5;
		}
	}

	function render()
    {
		if(!PRODUCTION)
        	game.debug.text((game.time.fps || '--') + ' fps', 5, 30, "#00ff00");
    }

});