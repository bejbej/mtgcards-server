(async () => {
    const { getAllSets, getCardsByUri } = require("../common/scryfall-dal.js");
    const { getAllSets: getKnownSets } = require("../common/set-dal.js");
    const { except } = require("../common/list.js");
    const { saveCards } = require("../common/card-dal.js");
    const { saveSet } = require("../common/set-dal.js");

    const numberToMigrate = process.argv[2] || 1;

    const allSets = await getAllSets();
    const knownSets = await getKnownSets();
    const unknownSets = except(allSets, knownSets, x => x.code);
    const setsToMigrate = unknownSets.slice(0, numberToMigrate);

    for (let i = 0; i < setsToMigrate.length; ++i) {
        const start = new Date();
        const set = setsToMigrate[i];
        const cards = await getCardsByUri(set.search_uri);
        await saveCards(cards);
        await saveSet(set);
        const end = new Date();
        console.log(`${set.name} - ${end - start}ms - ${setsToMigrate.length - i - 1} sets left`);
    }
})();