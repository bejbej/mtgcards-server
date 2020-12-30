(async () => {
    const { except } = require("../common/list.js");
    const { printSets } = require("../common/print-sets.js");
    const MongoDal = require("../common/mongo-dal.js");
    const ScryfallDal = require("../common/scryfall-dal.js");
    
    const mongoDal = new MongoDal();
    await mongoDal.init(); 

    const scryfallDal = new ScryfallDal();

    const knownSets = await mongoDal.getSetsByQuery();
    const allSets = await scryfallDal.getSetsByQuery();
    const unknownSets = except(allSets, knownSets, x => x.code);

    printSets(unknownSets);
})().finally(() => process.exit(0));