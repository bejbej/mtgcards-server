(async () => {
    const { printCards } = require("../common/print-cards.js");
    const { getAllCards } = require("../common/card-dal.js");

    const cards = await getAllCards();
    printCards(cards);
})();