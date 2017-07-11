module.exports = function () {
    var http = require("request-promise");
    var q = require("q");
    var db = require("../db/db.js");

    var getSavedSetNames = () => {
        return db.Set.find().then(sets => {
            return sets.map(set => set.name);
        });
    }

    var getSets = () => {
        return http.get("https://api.scryfall.com/sets").then(response => {
            return JSON.parse(response).data;
        });
    }

    var getCards = (set) => {
        var start = new Date();
        var recursiveGetCards = (uri, cards, deferred) => {
            http.get(uri).then(response => {
                response = JSON.parse(response);
                cards = cards.concat(response.data);
                if (response.next_page) {
                    recursiveGetCards(response.next_page, cards, deferred);
                } else {
                    var end = new Date();
                    console.log("Retrieved cards for " + set.name + " in " + (end - start) + "ms.");
                    deferred.resolve(cards);
                }
            }, deferred.reject);
        }

        var deferred = q.defer();
        recursiveGetCards(set.search_uri, [], deferred);
        return deferred.promise;
    }

    var getExistingCards = (names) => {
        return db.Card.find({ name: { $in: names } });
    }

    var parseCards = (cards) => {
        return cards.map(card => {
            if (card.type_line === undefined) {
                card.type_line = card.card_faces.map(x => x.type_line).join(" ");
            }
            return card;
        });
    }

    var saveSetName = (name) => {
        return db.Set.findOneAndUpdate({ name: name }, name, { upsert: true });
    }

    var saveSet = (set) => {
        return getCards(set).then(parseCards).then(cards => {
            return getExistingCards(cards.map(card => card.name)).then(existingCards => {
                return cards.map(card => {
                    var existingCard = existingCards.filter(existingCard => existingCard.name === card.name)[0];

                    if (existingCard) {
                        card.multiverse_id = card.multiverse_id > existingCard.multiverseId ? card.multiverse_id : existingCard.multiverseId;
                    }

                    return saveCard(card);
                });
            });

        }).then(q.all).then(() => {
            return saveSetName(set.name);
        });
    }

    var saveCard = (card) => {
        var determineType = (type_line) => {
            var types = ["creature", "artifact", "enchantment", "planeswalker", "land", "instant", "sorcery"];

            for (var i = 0; i < types.length; ++i) {
                if (type_line.toLowerCase().includes(types[i])) {
                    return types[i];
                }
            }
        }

        var determineColor = (colors) => {
            var colorDict = {
                W: "white",
                U: "blue",
                B: "black",
                R: "red",
                G: "green"
            }

            switch (colors.length) {
                case 0:
                    return "colorless"
                case 1:
                    return colorDict[colors[0]];
                default:
                    return "multicolored";
            }
        }

        var newCard = {
            name: card.name,
            cmc: card.cmc,
            color: determineColor(card.colors),
            primaryType: determineType(card.type_line),
            multiverseId: card.multiverse_id
        }

        return db.Card.findOneAndUpdate({ name: newCard.name }, newCard, { upsert: true });
    }

    var exec = (limit) => {
        return q.all([getSavedSetNames(), getSets()]).then(results => {
            var setNames = results[0];
            var sets = results[1];

            // Filter out sets that have already been added
            // Don't import un sets, or any sets that have weird card frames
            sets = sets.filter(set => ["promo", "funny", "masterpiece"].indexOf(set.set_type) === -1).filter(set => setNames.indexOf(set.name) === -1).slice(0, limit);

            return q.all(sets.map(saveSet)).then(() => {
                return sets.length;
            });
        });
    }

    return { exec: exec }
}();