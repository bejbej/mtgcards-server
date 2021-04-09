(async () => {
    const { getAllSets } = require("../common/set-dal.js");
    const { printSets } = require("../common/print-sets.js");

    const sets = await getAllSets();
    printSets(sets);
})().catch(x => console.log(x)).finally(() => process.exit(0));