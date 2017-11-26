const Card = require('../core/Card');

class WhiteCard extends Card
{
	constructor(image)
	{
		super(image);
		this.needFill = true;
	}
}

module.exports = WhiteCard