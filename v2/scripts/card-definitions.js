(async () => {
    const { printCards } = require("../common/print-cards.js");
    const MongoDal = require("../common/mongo-dal.js");
    const mongoDal = new MongoDal();
    await mongoDal.init();

    const cards = await mongoDal.getCardsByQuery();
    printCards(cards);
})().finally(() => process.exit(0));