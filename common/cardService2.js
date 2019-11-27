module.exports = function () {
    var http = require("request-promise");
    var db = require("../db/db.js");
    var cache = require("../common/cache.js");
    var List = require("../common/list.js");

    let cardTypes = [
        "creature",
        "land",
        "artifact",
        "enchantment",
        "planeswalker",
        "instant",
        "sorcery"
    ];

    let cardColors = {
        "W": "white",
        "U": "blue",
        "B": "black",
        "R": "red",
        "G": "green"
    }

    let filterCard = (card) => {
        // No contraptions
        if (card.type_line.indexOf("Contraption") > -1) {
            return false;
        }

        // Only card with approved card types
        if (!cardTypes.some(type => card.type_line.toLowerCase().indexOf(type) > -1)) {
            return false;
        }

        // Only english versions of cards
        if (card.lang !== "en") {
            return false;
        }

        return true;
    }

    let getMostReadableCardVersion = (cards) => {
        // Sort any non promo versions to the top of the list
        cards = cards.sort((a) => a.promo ? 1 : 0)
        let card = List.first(cards);
        return card;
    }

    let mapCard = (card, set) => {
        let determineName = (card) => {
            if (card.layout === "transform" || card.layout === "flip") {
                let primaryFace = card.card_faces.filter(face => card.name.indexOf(face.name) === 0)[0];
                return primaryFace.name;
            }

            return card.name;
        }

        let determineColor = (card) => {
            let colors = null;

            if (card.colors) {
                colors = card.colors;
            }
            else {
                let primaryFace = card.card_faces.filter(face => card.name.indexOf(face.name) === 0)[0];
                colors = primaryFace.colors;
            }

            switch (colors.length) {
                case 0:
                    return "colorless"
                case 1:
                    return cardColors[colors[0]];
                default:
                    return "multicolored";
            }
        }

        let determinePrimaryType = (card) => {
            let typeLine = null;

            if (!card.card_faces) {
                typeLine = card.type_line.toLowerCase();
            }
            else {
                let primaryFace = card.card_faces.filter(face => card.name.indexOf(face.name) === 0)[0];
                typeLine = primaryFace.type_line.toLowerCase();
            }

            for (let i = 0; i < cardTypes.length; ++i) {
                if (typeLine.indexOf(cardTypes[i]) > -1) {
                    return cardTypes[i];
                }
            }

            let message = "Can't determine the card type for " + typeLine;
            console.log(message);
            throw message;
        }

        let determineImageUri = (card) => {
            let uri = null;

            if (card.image_uris) {
                uri = card.image_uris.border_crop;
            }
            else {
                let primaryFace = card.card_faces.filter(face => card.name.indexOf(face.name) === 0)[0];
                uri = primaryFace.image_uris.border_crop;
            }

            return /border_crop\/([^\.]+)/.exec(uri)[1];
        }

        return {
            name: determineName(card),
            cmc: card.cmc,
            color: determineColor(card),
            primaryType: determinePrimaryType(card),
            printings:[{
                imageUri: determineImageUri(card),
                releasedOn: set.releasedOn
            }]
        };
    }

    let getCardsByUri = async (uri) => {
        let cards = [];
        while (uri) {
            let response = JSON.parse(await http.get(uri));
            cards = cards.concat(response.data);
            uri = response.next_page;
        }
        return cards;
    }

    let getBySet = (set) => {
        return cache.get(set.name + "_cards_parsed", async () => {
            let cards = await getCardsByUri(set.searchUri);
            let filteredCards = cards.filter(filterCard);
            let cardsGroupedByName = List.groupBy(filteredCards, card => card.name);
            let mostReadableCardVersion = cardsGroupedByName.map(getMostReadableCardVersion);
            let mappedCards = mostReadableCardVersion.map(card => mapCard(card, set));
            return mappedCards;
        });
    }

    let getAll = () => {
        return db.cards().find().toArray();
    }

    let save = async (card) => {
        let existingCard = await db.cards().findOne({name: card.name})
        if (!existingCard) {
            await db.cards().findOneAndUpdate({name: card.name}, card, {upsert: true});
            return;
        }

        let thisPrinting = card.printings[0];
        if (existingCard.printings.some(x => x.imageUri === thisPrinting.imageUri)) {
            return;
        }

        existingCard.printings.push(thisPrinting);
        await db.cards().findOneAndUpdate({name: card.name}, existingCard, {upsert: true});
    }

    return {
        getAll: getAll,
        getBySet: getBySet,
        save: save
    }
}();