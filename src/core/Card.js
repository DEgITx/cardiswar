global.CARD_ID = 0;

class Card
{
	constructor(image)
	{
		this.id = ++CARD_ID;
		this.nextCard = null;
		this.prevCard = null;
		this.mapPlayers = {};
		this.owner = null;
		this.position = -1;

		this.x = 50;
		this.y = 50;
		this.height = 85;
		this.width = 85;

		this.image = image || '';
		this.needFill = false;
		this.fillColor = 0xFFFFFF;

		this.text = '';
		this.description = '';
	}

	toJSON()
	{
		let obj = Object.assign(
		{}, this);
		obj.nextCard = null;
		obj.prevCard = null;
		if (obj.owner != null)
			obj.owner = obj.owner.id;
		obj.mapPlayers = [];
		for (let id in this.mapPlayers)
			obj.mapPlayers.push(id);
		return obj;
	}

	postStep(map, player, position, path)
	{

	}

	preStep(map, player, position)
	{
		return true;
	}

	inStep(map, player, position)
	{

	}
}

module.exports = Card