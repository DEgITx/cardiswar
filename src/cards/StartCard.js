const Card = require('../core/Card');

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

module.exports = StartCard