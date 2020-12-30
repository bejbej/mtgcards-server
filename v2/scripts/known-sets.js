(async () => {
    const { printSets } = require("../common/print-sets.js");
    const MongoDal= require("../common/mongoDal.js");
    const mongoDal = new MongoDal();
    await mongoDal.init();

    const sets = await mongoDal.getSetsByQuery();
    printSets(sets);
})().finally(() => process.exit(0));