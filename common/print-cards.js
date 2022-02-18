const { determinePrimaryType, determineName, determineColor, determineImageUri, determineDoubleFace } = require("../common/card-parser.js");

module.exports = class {
    static printCards = (cards) => {
        
        const csv = "name\tprimaryType\tcmc\tcolor\timageuri\tdoubleFace\n" + cards
        .sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)
        .map(card => {
            try
            {

                const name = determineName(card);
                const color = determineColor(card);
                const type = determinePrimaryType(card);
                const imageUri = determineImageUri(card);
                const doubleFace = determineDoubleFace(card);
                return `${name}\t${type}\t${card.cmc}\t${color}\t${imageUri}${doubleFace}`;
            }
            catch (e) {
                return "";
            }
        })
        .join("\n");
        
        console.log(csv);
    }
}