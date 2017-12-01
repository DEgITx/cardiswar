
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
			map.movePlayer(player, this.portalPoint);
			path.push(this.portalPoint);
		}
	}
}

module.exports = PortalCard