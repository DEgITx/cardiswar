const Card = require('../core/Card');
const IgnorePrisonCard = require('./IgnorePrisonCard')

class RandomHolderCard extends Card
{
	constructor(image)
	{
		super(image);
		this.description = 'Здесь можно получить бесплатную карточку';
		this.image = 'images/cards/holder.png';
		this.needFill = true;
		this.cards = [];
	}

	setCards(cards)
	{
		this.cards = cards;
	}

	addCard(card)
	{
		this.cards.push(card);
	}

	postStep(map, player, position, path)
	{
		if (this.cards.length > 0)
		{
			const object = this.cards[Math.floor(Math.random() * this.cards.length)];
			if (object instanceof IgnorePrisonCard)
				map.addPlayerCard(player, new IgnorePrisonCard);
		}
	}
}

module.exports = RandomHolderCard