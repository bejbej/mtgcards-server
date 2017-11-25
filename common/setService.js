module.exports = function () {
    var http = require("request-promise");
    var db = require("../db/db.js");
    var cache = require("../common/cache.js");

    // whitelist of sets to prevent multiverseids of textless/unreadable promos
    let setTypeWhitelist = [
        "expansion",
        "commander",
        "archenemy",
        "planechase",
        "conspiracy",
        "core",
        "masters",
        "starter",
        "duel_deck",
        "box",
        "from_the_vault",
        "premium_deck",
        "funny",
    ];

    let getByCode = (code) => {
        return getAll()
        .then(sets => {
            let set = sets.filter(set => set.code.toLowerCase() === code.toLowerCase())[0];

            if (set === undefined) {
                throw "Can't find a set with a code of " + code;
            }

            return set;
        })
    }

    let getAll = () => {
        return cache.get("set", () => {
            return http.get("https://mtgjson.com/json/SetList.json")
            .then(response => JSON.parse(response))
            .then(sets => {
                return sets.map(set => {
                    return {
                        name: set.name,
                        code: set.code
                    };
                });
            });
        });
    }

    let getAllMeta = () => {
        return cache.get("setmeta", () => {
            return http.get("https://api.scryfall.com/sets")
            .then(response => {
                return JSON.parse(response).data;
            })
            .then(sets => {
                return sets.filter(set => setTypeWhitelist.indexOf(set.set_type) > -1);
            });
        });
    }

    let getKnown = () => {
        return db.Set.find();
    }

    let getUnknown = () => {
        return Promise.all([getAll(), getAllMeta(), getKnown()]).then(response => {
            let allSets = response[0];
            let allMeta = response[1];
            let knownSets = response[2];

            let unknownSets = allSets.filter(set => !knownSets.some(knownSet => knownSet.code.toLowerCase() === set.code.toLowerCase()));
            unknownSets = unknownSets.filter(unknownSet => allMeta.some(meta => meta.code.toLowerCase() === unknownSet.code.toLowerCase()));

            return unknownSets.map(unknownSet => {
                return allSets.filter(set => set.code.toLowerCase() === unknownSet.code.toLowerCase())[0];
            });
        });
    }

    let save = (set) => {
        return db.Set.findOneAndUpdate({name: set.name}, set, {upsert: true});
    }

    return {
        getByCode: getByCode,
        getUnknown: getUnknown,
        getKnown: getKnown,
        save: save
    }
}();