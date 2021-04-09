(async () => {
    const { getAllCards } = require("../common/card-dal.js");
    const { saveCardPage } = require("../common/card-page-dal.js");
    const { asyncMap } = require("../common/async-map.js");

    const cards = await getAllCards();
    await asyncMap(cards, async (card, index) => {
        if (index % 1000 === 0) {
            console.log(`writing ${index}/${cards.length}`);
        }
        await saveCardPage(card);
    }, 5000);
})();