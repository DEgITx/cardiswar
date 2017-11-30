const Card = require('../core/Card');
const PurchaseCard = require('../cards/PurchaseCard')

class RandomBuyCard extends Card
{
	constructor(image)
	{
		super(image);
		this.image = 'images/cards/antiprison.jpg';
		this.text = 'Вы можете использовать эту карту на вашем поле. Используя эту карту вы продадите свою и купите любую свободную карту в области (на которую у вас хватит денег). Осторожно - вам может попасться та же карта что была до этого';
		this.color = 0xAAAAAA;
	}

	use(map, player)
	{
		console.log('random buy card use')
		const card = this;
		const sellCard = map.map[map.players[player.id].position];
		const cell = map.sellCard(player, sellCard);
		if(cell < 0)
			return;

		const cardArray = []
		for(const mapCard of map.map)
		{
			if (!(mapCard instanceof PurchaseCard) || mapCard.owner)
				continue;
			
			cardArray.push(mapCard)
		}
		console.log(cardArray.length)

		function shuffle(a) {
			for (let i = a.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[a[i], a[j]] = [a[j], a[i]];
			}
			return a;
		}

		shuffle(cardArray)
		for(let randomCard of cardArray)
		{
			if(map.canBuyCard(player, randomCard))
			{
				console.log('changed card to new')
				map.buyCard(player, randomCard)
				map.removePlayerCard(player, this)
				return {
					map: map.map
				}
			}
		}
	}
}

module.exports = RandomBuyCard