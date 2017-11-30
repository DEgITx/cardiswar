const Card = require('../core/Card');

class PurchaseCard extends Card
{
	constructor(cost, penalty, group)
	{
		super();
		this.cost = cost || 0;
		this.penalty = penalty || [];
		this.currentPenalty = 0;
		this.group = group || null;
		this.groupPower = 0;
	}

	postStep(map, player, position, path)
	{
		if (this.owner == null || this.owner == player)
		{
			console.log('Nothing to pay');
			return;
		}

		if (this.penalty[this.currentPenalty] != null && this.penalty[this.currentPenalty] > 0)
		{
			player.money -= this.penalty[this.currentPenalty];
			this.owner.money += this.penalty[this.currentPenalty];
		}
		if (this.currentPenalty < this.penalty.length - 1)
			this.currentPenalty++
			else
				this.currentPenalty = 0;

		function canPlayerRehab(player)
		{
			let costSum = 0;
			player.inventory.forEach(function(card, index)
			{
				if (card instanceof PurchaseCard)
				{
					costSum += card.cost;
				}
			});
			return player.money + costSum > 0;
		}

		// проигравшие
		if (player.money <= 0)
		{
			if (canPlayerRehab(player))
			{
				map.losers.push(player);
				console.log('adding player ' + player.nick + ' to losers list');
			}
			//else
			//	map.removePlayer(player);
		}

		if (this.owner.money <= 0)
		{
			if (canPlayerRehab(this.owner))
			{
				map.losers.push(this.owner);
				console.log('adding player ' + this.owner.nick + ' to losers list');
			}
			//else
			//	map.removePlayer(this.owner);
		}
	}

	preStep(map, player, position)
	{
		if (player.money <= 0)
			return false;

		return true;
	}

}

module.exports = PurchaseCard