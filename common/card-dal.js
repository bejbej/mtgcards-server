const fs = require("fs").promises;
const { sanitizeFileName } = require("./sanitize-file-name.js");
const { asyncMap } = require("./async-map.js");
const { first, groupBy, unique } = require("./list.js");
const cardDirName = __dirname + "/../data/cards";

const getOrCreateCardFile = async (fileName) => {
    try {
        const file = await fs.readFile(fileName);
        return JSON.parse(file);
    }
    catch {
        return [];
    }
}

const computeDesirability = (card) => {
    const setTypes = [
        "masterpiece",
        "box",
        "promo",
        "spellbook"
    ];

    const sets = [
        "plist"
    ]

    const frameEffects = [
        "extendedart",
        "showcase",
        "etched"
    ]

    if (setTypes.some(setType => setType === card.set_type)) {
        return 0;
    }

    if (sets.some(set => set === card.set)) {
        return 1;
    }

    if (card.frame === "1997") {
        return 2;
    }

    if (card.full_art) {
        return 3;
    }

    if (card.frame_effects && frameEffects.some(frameEffect => card.frame_effects.some(cardFrameEffect => cardFrameEffect === frameEffect))) {
        return 4;
    }

    return 5;
}

const getMostDesirablePrinting = (printings) => {
    const sortedPrintings = printings.map(card => {
        return {
            desirability: computeDesirability(card),
            card: card
        };
    }).sort((a, b) => {
        if (a.desirability > b.desirability) {
            return -1;
        }

        if (a.desirability < b.desirability) {
            return 1;
        }

        return a.card.released_at === b.card.released_at;
    });

    return first(sortedPrintings).card;
}

module.exports = class CardDal {
    static async getAllCards() {
        const fileNames = await fs.readdir(cardDirName);
        const files = await asyncMap(fileNames, async fileName => await fs.readFile(`${cardDirName}/${fileName}`), 5000);
        const printings = files.map(x => JSON.parse(x));
        return printings.map(cards => getMostDesirablePrinting(cards));
    }

    static async saveCards(cards) {
        const cardsGroupedByName = groupBy(cards, x => x.name);
        await asyncMap(cardsGroupedByName, async cards => {
            const cardName = first(cards).name;
            const fileName = `${cardDirName}/${sanitizeFileName(cardName)}.json`;
            const file = await getOrCreateCardFile(fileName);
            const newFile = unique(file.concat(cards), x => x.id);
            await fs.writeFile(fileName, JSON.stringify(newFile, null, 2));
        }, 5000);
    }
}