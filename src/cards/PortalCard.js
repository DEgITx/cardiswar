
const Card = require('../core/Card');

class PortalCard extends Card
{
	constructor(image)
	{
		super(image);
		this.image = 'images/cards/portal.png';
		this.needFill = true;
		this.portalPoint = -1;
	}

	setPortalDestination(card)
	{
		this.portalPoint = card.position;
	}

	postStep(map, player, position, path)
	{
		if (this.portalPoint > 0)
		{
			map.players[player.id].position = this.portalPoint;
			delete this.mapPlayers[player.id];
			map.map[this.portalPoint].mapPlayers[player.id] = player;
			path.push(this.portalPoint);
		}
	}
}

module.exports = PortalCard