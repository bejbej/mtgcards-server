(async () => {
    const { printCards } = require("../common/print-cards.js");
    const { getSetByCode, getCardsByUri } = require("../common/scryfall-dal.js");

    const code = process.argv[2] || "znr";
    const set = await getSetByCode(code);
    const cards = await getCardsByUri(set.search_uri);
    printCards(cards);
})().catch(x => console.log(x)).finally(() => process.exit(0));