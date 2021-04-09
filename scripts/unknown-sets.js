(async () => {
    const { getAllSets } = require("../common/scryfall-dal.js");
    const { getAllSets: getKnownSets } = require("../common/set-dal.js");
    const { except } = require("../common/list.js");
    const { printSets } = require("../common/print-sets.js");
    
    const allSets = await getAllSets();
    const knownSets = await getKnownSets();
    const unknownSets = except(allSets, knownSets, x => x.code);

    printSets(unknownSets);
})();