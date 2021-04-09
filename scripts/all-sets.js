(async () => {
    const { getAllSets } = require("../common/scryfall-dal.js");
    const { printSets } = require("../common/print-sets.js");
    
    const sets = await getAllSets();
    printSets(sets);
})();