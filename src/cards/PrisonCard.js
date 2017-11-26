const Card = require('../core/Card');
const IgnorePrisonCard = require('./IgnorePrisonCard')

class PrisonCard extends Card
{
	constructor(stepskip)
	{
		super();
		this.stepskip = stepskip || 2;
		this.image = 'images/cards/prison.png';
		this.description = 'Добро пожаловать тюрячку. Вы сами знаете что сдесь делают. Вы пропускаете 2 хода (кликать нужно).';
	}

	postStep(map, player, position, path)
	{
		let findIgnore = false;
		player.inventory.forEach(function(card, index)
		{
			if (card instanceof IgnorePrisonCard)
			{
				map.removePlayerCard(player, card);
				findIgnore = true;
			}
		});
		if (findIgnore)
			return;

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

module.exports = PrisonCard