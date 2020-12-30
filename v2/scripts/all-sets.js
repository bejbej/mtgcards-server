(async () => {
    const ScryfallDal = require("../common/scryfall-dal.js");
    const { printSets } = require("../common/print-sets.js");
    
    const scryfallDal = new ScryfallDal();
    const allSets = await scryfallDal.getSetsByQuery();
    printSets(allSets);
})().finally(() => process.exit(0));