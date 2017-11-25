/*
class Card {
    name: string;
}
*/
module.exports = function () {
    var http = require("request-promise");
    var db = require("../db/db.js");
    var cache = require("../common/cache.js");

    var getAll = () => {
        return db.Card.find();
    }

    var getByCode = (code) => {
        db.Card.find({primaryType: "Contraption"}).remove().exec();

        return cache.get("cards_"+code, () => {
            return http.get("https://mtgjson.com/json/"+ code + ".json")
            .then(response => JSON.parse(response).cards)
            .then(cards => cards.filter(card => {
                if (card.types === undefined) {
                    return false;
                }

                if (card.layout === "token") {
                    return false;
                }

                if (card.subtypes && card.subtypes.indexOf("Contraption") > -1) {
                    return false;
                }

                if (card.types.some(type => type.toLowerCase() === "token")) {
                    return false;
                }

                return true;
            }))
            .then(groupByMultiverseId)
            .then(cardGroups => cardGroups.map(parseCardGroup))
            .then(cards => cards.filter(card => card.primaryType !== undefined))
        });
    }

    var groupByMultiverseId = (cards) => {
        let cardDictionary = cards.reduce((dictionary, card) => {
            // If this card is the second face of a double faced card we don't want it
            if (card.layout === "double-faced" && card.names.indexOf(card.name) === 1) {
                return dictionary;
            }

            let key = card.multiverseid;
            
            if (dictionary[key] === undefined) {
                dictionary[key] = [];
            }

            dictionary[key].push(card);

            return dictionary;
        }, {});

        return Object.keys(cardDictionary).map(key => cardDictionary[key]);


    }

    var parseCardGroup = (cardGroup) => {
        var determineName = (cardGroup) => {
            let card = cardGroup[0];

            if (card.layout === "split") {
                return card.names.join(" // ");
            }

            if (card.layout === "aftermath") {
                return card.names.join(" // ");
            }

            return card.name;
        }

        var determineCMC = (cardGroup) => {
            let card = cardGroup[0];

            if (card.layout === "split") {
                return cardGroup.reduce((sum, card) => {
                    return sum + card.cmc;
                } ,0);
            }

            return card.cmc;
        }

        var determineType = (cardGroup) => {
            let card = cardGroup[0];
            let types = ["creature", "land", "artifact", "enchantment", "planeswalker", "instant", "sorcery"];

            for (var i = 0; i < types.length; ++i) {
                if (card.types.some(cardType => types[i] === cardType.toLowerCase())) {
                    return types[i];
                }
            }

            return undefined;
        }

        var determineColor = (cardGroup) => {
            let colorDictionary = {};

            cardGroup.forEach(card => {
                if (card.colors) {
                    card.colors.forEach(color => colorDictionary[color.toLowerCase()] = true)
                }
            });

            let colors = Object.keys(colorDictionary);
            if (colors.length === 0) {
                return "colorless"
            }

            if (colors.length === 1) {
                return colors[0].toLowerCase();
            }

            if (colors.length > 1) {
                return "multicolored";
            }
        }

        return {
            name: determineName(cardGroup),
            cmc: determineCMC(cardGroup),
            color: determineColor(cardGroup),
            primaryType: determineType(cardGroup),
            multiverseId: cardGroup[0].multiverseid || 0
        }
    }

    var save = (card) => {
        return db.Card.findOneAndUpdate(
            {
                name: card.name
            },
            {
                $set: {
                    name: card.name,
                    cmc: card.cmc,
                    color: card.color,
                    primaryType: card.primaryType
                },
                $max: {
                    multiverseId: card.multiverseId
                }
            },
            {
                upsert: true
            }
        );
    }

    return {
        getAll: getAll,
        getByCode: getByCode,
        save: save
    }
}();