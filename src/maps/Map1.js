const CardMap = require('../core/CardMap');
const CardGroup = require('../core/CardGroup');
const IgnorePrisonCard = require('../cards/IgnorePrisonCard');
const PortalCard = require('../cards/PortalCard');
const PrisonCard = require('../cards/PrisonCard');
const PurchaseCard = require('../cards/PurchaseCard');
const RandomHolderCard = require('../cards/RandomHolderCard');
const WhiteCard = require('../cards/WhiteCard');
const StartCard = require('../cards/StartCard');
const RandomBuyCard = require('../cards/RandomBuyCard')

module.exports = () => {
    let map = new CardMap;
    // Рисуем карту
    map.append(new StartCard); // Старт
    var sunGroup = new CardGroup(0xD6D600, 'images/cards/sun.png', 'Это солнечный сет, несущий счатье и радость людям. Единственный минус, то что он слабенький.');
    map.append(new PurchaseCard(250, [100, 200, 250, 300, 350], sunGroup));
    var random_card1 = new RandomHolderCard;
    random_card1.addCard(new IgnorePrisonCard);
    random_card1.addCard(new RandomBuyCard);
    map.append(random_card1);
    map.append(new PurchaseCard(350, [200, 350, 500, 600, 750], sunGroup));
    map.append(new PurchaseCard(500, [300, 400, 550, 700, 900], sunGroup));
    var treeGroup = new CardGroup(0x74E30B, 'images/cards/tree.jpg', 'Древестный сет. Почувствуйте себя настоящим садоводом на поле боя.');
    map.append(new PurchaseCard(750, [500, 650, 800, 1000, 1100], treeGroup));
    var portal_1 = new PortalCard;
    map.append(portal_1);
    map.append(new PurchaseCard(900, [700, 850, 900, 1200, 1400], treeGroup));
    map.append(new PurchaseCard(1000, [800, 950, 1100, 1300, 1500], treeGroup));
    map.append(new PrisonCard);
    map.append(new PurchaseCard(1250, [1000, 1200, 1400, 1600, 1750], treeGroup));
    map.append(new WhiteCard);
    let pure_1 = new WhiteCard;
    map.append(pure_1, CARD_BOTTOM);
    portal_1.setPortalDestination(pure_1);
    var krakenGroup = new CardGroup(0xAA2AEB, 'images/cards/kraken.jpg', 'Вы приютили у себя небольшого кракена. Он машет вам щупальцами в знак благодарности.');
    map.append(new PurchaseCard(1500, [1300, 1600, 1800, 2000, 2200], krakenGroup), CARD_BOTTOM);
    map.append(new PurchaseCard(1750, [1500, 1800, 2000, 2150, 2500], krakenGroup), CARD_LEFT);
    map.append(new WhiteCard, CARD_LEFT);
    map.append(new PurchaseCard(2000, [1600, 1800, 2100, 2500, 2750], krakenGroup), CARD_LEFT);
    map.append(new PurchaseCard(2500, [2200, 2500, 2800, 3100, 3400], krakenGroup), CARD_LEFT);
    var waterGroup = new CardGroup(0x2A74EB, 'images/cards/water.png', 'Вы выбрали путь повелителя водички. Смывайте своих врагов, однако не забывайте закрывать кран.');
    map.append(new PurchaseCard(2750, [2600, 2900, 3100, 3300, 3450], waterGroup), CARD_LEFT);
    map.append(new PurchaseCard(3000, [2800, 3250, 3500, 3750, 4000], waterGroup), CARD_LEFT);
    map.append(new PurchaseCard(3500, [3200, 3500, 3900, 4300, 4700], waterGroup), CARD_LEFT);
    map.append(new PrisonCard, CARD_BOTTOM);
    map.append(new PurchaseCard(4000, [2200, 4000, 5000, 5200, 5500], waterGroup), CARD_BOTTOM);
    var fireGroup = new CardGroup(0xEB342A, 'images/cards/fire.png', 'Ваши глаза заглись в пламени ночи. Что может быть лучше чем испепялять своих врагов, закидывая их сигаретами?');
    map.append(new PurchaseCard(5000, [3500, 4000, 4500, 5200, 5400], fireGroup), CARD_RIGHT);
    map.append(new PurchaseCard(5500, [4500, 4700, 5200, 5600, 6000], fireGroup), CARD_RIGHT);
    map.append(new WhiteCard);
    map.append(new PurchaseCard(5750, [4900, 5400, 5750, 6000, 6400], fireGroup), CARD_RIGHT);
    map.append(new PurchaseCard(6000, [5200, 5400, 6100, 6600, 7100], fireGroup), CARD_RIGHT);
    map.append(new PurchaseCard(6500, [6500, 7000, 7400, 7600, 8000], fireGroup), CARD_RIGHT);
    map.append(new WhiteCard, CARD_RIGHT);
    var strangeGroup = new CardGroup(0x8C8C8C, 'images/cards/question_wh.png', 'Очень странный сет карт. Я вам как создатель этого сета заявляю. Не покупайте его больше.');
    map.append(new PurchaseCard(6969, [4647, 5505, 6969, 6969, 0], strangeGroup), CARD_BOTTOM);
    map.append(new PurchaseCard(1408, [1408, 1408, 8041, 8041, 8041], strangeGroup), CARD_BOTTOM);
    map.append(new PurchaseCard(1, [0, 0, 1, 1, 1001], strangeGroup), CARD_LEFT);
    map.append(new WhiteCard, CARD_LEFT);
    map.append(new PurchaseCard(-7000, [-3000, -4000, -5000, 17502, 24242], strangeGroup), CARD_LEFT);
    var electricityGroup = new CardGroup(0xFFE17D, 'images/cards/electricity.png', 'Фонарик, дрель, электропсихометр - эти приборы объединяет одно. Их нету у тебя дома. Вообщем электрический сет.');
    map.append(new PurchaseCard(7200, [6500, 6600, 6900, 7800, 9000], electricityGroup), CARD_LEFT);
    map.append(new PurchaseCard(8000, [6300, 8000, 9000, 10000, 11000], electricityGroup), CARD_LEFT);
    map.append(new WhiteCard, CARD_LEFT);
    map.append(new PurchaseCard(9500, [8000, 9500, 11000, 11500, 12000], electricityGroup), CARD_LEFT);
    map.append(new WhiteCard, CARD_LEFT);
    map.append(new PurchaseCard(10000, [8500, 10000, 12500, 14000, 15000], electricityGroup), CARD_LEFT);
    map.append(new PrisonCard, CARD_LEFT);
    var inyanGroup = new CardGroup(0xDB3B9E, 'images/cards/inyan.jpg', 'Добро и зло - эти 2 карты неразлучны, до того момента пока 2 идиота их не купят, каждый по одной.');
    map.append(new PurchaseCard(12500, [10000, 12500, 15000, 17500, 20000], inyanGroup), CARD_TOP);
    map.append(new PurchaseCard(15000, [15000, 17500, 20000, 22000, 25000], inyanGroup), CARD_TOP);
    var darknessGroup = new CardGroup(0x010101, 'images/cards/darkness.png', 'Темной темной ночью. На темной темной улице. В темном темном переулке ничего не произошло.');
    darknessGroup.textColor = 0xFFFFFF;
    map.append(new PurchaseCard(18000, [15000, 18000, 20000, 25000, 27500], darknessGroup), CARD_TOP);
    map.append(new PurchaseCard(20000, [17500, 19000, 24000, 28000, 30000], darknessGroup), CARD_LEFT);
    map.append(new WhiteCard, CARD_TOP);
    map.append(new PurchaseCard(25000, [20000, 25000, 30000, 35000, 40000], darknessGroup), CARD_TOP);
    
    return map;
}