module.exports = function () {
    var http = require("request-promise");
    var db = require("../db/db.js");
    var cache = require("../common/cache.js");

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
        if (!card.type_line) {
            return true;
        }

        if (card.type_line.indexOf("Contraption") > -1) {
            return false;
        }

        if (cardTypes.some(type => card.type_line.toLowerCase().indexOf(type) > -1)) {
            return true;
        }

        return false;
    }

    let mapCard = (card) => {
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

            return /en\/([^\.]+)/.exec(uri)[1];
        }

        return {
            name: determineName(card),
            cmc: card.cmc,
            color: determineColor(card),
            primaryType: determinePrimaryType(card),
            multiverseId: card.multiverse_ids.max(id => id) || 0,
            imageUri: determineImageUri(card)
        };
    }

    let get = (uri, cards) => {
        if (!uri) {
            return Promise.resolve(cards)
        }

        return http.get(uri)
        .then(response => JSON.parse(response))
        .then(response => {
            cards = cards.concat(response.data);
            return get(response.next_page, cards);
        });
    }

    let getBySet = (set) => {
        return cache.get(set.name + "_cards_parsed", () => {
            return cache.get(set.name + "_cards_raw", () => {
                return get(set.searchUri, []);
            })
            .then(cards => cards.filter(filterCard))
            .then(cards => cards.map(card => mapCard(card, set)))
            .then(cards => cards.unique(card => card.name));
        });
    }

    let getAll = () => {
        return db.Card.find();
    }

    let save = (card) => {
        return db.Card.findOne({name: card.name})
        .then(x => {
            if (x && x.multiverseId > card.multiverseId) {
                return Promise.resolve();
            }

            return db.Card.findOneAndUpdate({name: card.name}, card, {upsert: true});
        });
    }

    return {
        getAll: getAll,
        getBySet: getBySet,
        save: save,
        fix: fix
    }
}();