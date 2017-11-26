const Card = require('../core/Card');

class IgnorePrisonCard extends Card
{
	constructor(image)
	{
		super(image);
		this.image = 'images/cards/antiprison.jpg';
		this.text = 'Вы можете выйти из тюрячки не мотая срок, ведь этой карты вполне достаточно чтобы забашлять охране';
		this.color = 0xAAAAAA;
	}
}

module.exports = IgnorePrisonCard