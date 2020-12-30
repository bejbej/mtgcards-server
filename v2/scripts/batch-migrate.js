(async () => {
    const { except } = require("../common/list.js");
    const MongoDal = require("../common/mongo-dal.js");
    const ScryfallDal = require("../common/scryfall-dal.js");
    
    const mongoDal = new MongoDal();
    await mongoDal.init(); 

    const scryfallDal = new ScryfallDal();

    const numberToMigrate = process.argv[2] || 50;
    const knownSets = await mongoDal.getSetsByQuery();
    const allSets = await scryfallDal.getSetsByQuery();
    const unknownSets = except(allSets, knownSets, x => x.code).slice(0, numberToMigrate);

    for (let i = 0; i < unknownSets.length; ++i) {
        const start = new Date();
        const set = unknownSets[i];
        const cards = await scryfallDal.getCardsBySet(set);
        await Promise.all(cards.map(mongoDal.insertOrUpdateCard));
        await mongoDal.insertSet(set);

        const end = new Date();
        console.log(`${set.name} - ${end - start}ms - ${unknownSets.length - i - 1} sets left`);
    }

})().catch(x => console.log(x)).finally(() => process.exit(0));