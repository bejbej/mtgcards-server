const { determinePrimaryType, determineName, determineColor, determineImageUri } = require("../common/card-parser.js");

module.exports = class {
    static printCards = (cards) => {
        
        const csv = "name\tprimaryType\tcmc\tcolor\timageuri\n" + cards.map(card => {
            try
            {

                const name = determineName(card);
                const color = determineColor(card);
                const type = determinePrimaryType(card);
                const imageUri = determineImageUri(card);
                return `${name}\t${type}\t${card.cmc}\t${color}\t${imageUri}\n`;
            }
            catch (e) {
                return "";
            }
        }).sort().join("");
        
        console.log(csv);
    }
}