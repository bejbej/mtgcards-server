module.exports = class {
    static printCards = (cards) => {
        const { first } = require("../common/list.js");
        const csv = "name\tprimaryType\tcmc\tcolor\tscryfallId\n" + cards.map(card => {
            const sortedPrintings = card.printings.sort((a, b) => {
                const isAPromo = a.promoTypes != null;
                const isBPromo = b.promoTypes != null;
                if (isAPromo == isBPromo) {
                    return a.releasedOn < b.releasedOn ? 1 : -1;
                }
                else {
                    return isAPromo ? 1 : -1;
                }
            });
            let scryfallId = first(sortedPrintings).scryfallId;
            return card.name + "\t" + card.primaryType + "\t" + card.cmc + "\t" + card.color + "\t" + scryfallId + "\n";
        }).sort().join("");
    
        console.log(csv);
    }
}