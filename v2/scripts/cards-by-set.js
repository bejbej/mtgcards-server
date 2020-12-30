(async () => {
    const { printCards } = require("../common/print-cards.js");
    const { single } = require("../common/list.js");
    const ScryfallDal = require("../common/scryfall-dal.js");
    const scryfallDal = new ScryfallDal();

    const code = process.argv[2] || "cmr";
    const sets = await scryfallDal.getSetsByQuery();
    const set = single(sets.filter(x => x.code.toLowerCase() == code.toLowerCase()));
    const cards = await scryfallDal.getCardsBySet(set);
    printCards(cards);
})().catch(x => console.log(x)).finally(() => process.exit(0));