global.CARD_GROUP_ID = 0;

class CardGroup
{
	constructor(color, image, text)
	{
		this.id = ++CARD_GROUP_ID;
		this.color = color || '0xFF0000';
		this.image = image || '';
		this.text = text || '';
		this.description = '';
	}
}

module.exports = CardGroup
