module.exports = function () {

    const http = require("request-promise");
    const { groupBy, union, first } = require("../common/list.js");
    const baseUri = "https://api.scryfall.com/sets";

    const setTypeWhitelist = [
        "core",
        "draft_innovation",
        "expansion",
        "masters",
        "duel_deck",
        "commander",
        "planechase",
        "conspiracy",
        "archenemy",
        "funny",
        "starter"
    ];

    const setCodeWhitelist = [
        "gnt",  // Game Night
        "gn2",
        "g18"  // M19 Gift Pack
    ]

    const setCodeBlacklist = [
        "ren",  // Foreign Language
        "rin",  // Foregin Language
        "fbb",  // Foregin Language
        "4bb",
        "mznr"
    ];

    const cardTypes = [
        "conspiracy",
        "creature",
        "land",
        "artifact",
        "enchantment",
        "planeswalker",
        "instant",
        "sorcery"
    ];

    const creatureCardTypes = [
        "summon",
        "autobot character"
    ]

    const cardColors = {
        "W": "white",
        "U": "blue",
        "B": "black",
        "R": "red",
        "G": "green"
    }

    const filterSet = (set) => {
        if (setCodeWhitelist.indexOf(set.code) > -1) {
            return true;
        }

        if (set.digital) {
            return false;
        }

        if (setTypeWhitelist.indexOf(set.set_type) === -1) {
            return false;
        }

        if (setCodeBlacklist.indexOf(set.code) > -1) {
            return false;
        }

        let cutoffMs = new Date().getTime() + 1209600000; // Sets are generally spoiled 2 full weeks before official release
        let setMs = new Date(set.released_at).getTime();
        if (setMs > cutoffMs) {
            return false;
        }

        return true;
    }

    const filterCard = (card) => {
        const allowedCardTypes = cardTypes.concat(creatureCardTypes);
        if (!allowedCardTypes.some(cardType => card.type_line.toLowerCase().indexOf(cardType) > -1)) {
            console.log(`excluding ${card.name} because it is of type ${card.type_line}`)
            return false;
        }

        return true;
    }

    const mapSet = (set) => {
        if (!set) {
            return null;
        }

        return {
            name: set.name,
            code: set.code,
            searchUri: set.search_uri,
            releasedOn: new Date(set.released_at),
            type: set.set_type
        }
    }

    const mapCard = (card) => {
        const determineName = (card) => {
            if (card.layout === "transform" || card.layout === "flip") {
                let primaryFace = card.card_faces.filter(face => card.name.indexOf(face.name) === 0)[0];
                return primaryFace.name;
            }

            return card.name;
        }

        const determineColor = (card) => {
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

        const determinePrimaryType = (card) => {
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

            if (creatureCardTypes.some(cardType => card.type_line.toLowerCase().indexOf(cardType) == 0)) {
                return "creature";
            }

            let message = "Can't determine the card type of " + typeLine + " for " + card.name;
            console.log(message);
            throw message;
        }

        return {
            name: determineName(card),
            cmc: card.cmc,
            color: determineColor(card),
            primaryType: determinePrimaryType(card),
            printings:[{
                scryfallId: card.id,
                releasedOn: card.released_at,
                promoTypes: card.promo_types
            }]
        };
    }

    const getCardsByUri = async (uri) => {
        let cards = [];
        while (uri) {
            let response = JSON.parse(await http.get(uri));
            cards = cards.concat(response.data);
            uri = response.next_page;
        }
        return cards;
    }

    this.getCardsBySet = async (set) => {
        const rawCards = await getCardsByUri(set.searchUri);
        const filteredCards = rawCards.filter(filterCard);
        const mappedCards = filteredCards.map(mapCard);
        const cardsGroupedByName = groupBy(mappedCards, x => x.name);
        const cards = cardsGroupedByName.map(cards => {
            let printings = [];
            for (let i = 0; i < cards.length; ++i) {
                const card = cards[i];
                printings = union(printings, card.printings, x => x.scryfallId);
            }
            const card = first(cards);
            card.printings = printings;
            return card;
        });
        return cards;
    } 

    this.getSetsByQuery = async () => {
        let response = await http.get(baseUri);
        let sets = JSON.parse(response).data;
        let filteredSets = sets.filter(filterSet);
        return filteredSets.map(mapSet);
    }
}