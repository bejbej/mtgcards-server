module.exports = function () {
    var http = require("request-promise");
    var db = require("../db/db.js");
    var cache = require("../common/cache.js");

    let baseUri = "https://api.scryfall.com/sets";

    let setTypeWhitelist = [
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

    let setCodeBlacklist = [
        "ana"
    ];

    let filterSet = (set) => {
        if (setTypeWhitelist.indexOf(set.set_type) === -1) {
            return false;
        }

        if (setCodeBlacklist.indexOf(set.code) > -1) {
            return false;
        }

        if (set.name.indexOf("World Championship") === 0) {
            return false;
        }

        let cutoff = new Date() + 1209600000; // Sets are generally spoiled 2 full weeks before official release
        if (new Date(set.released_at) > cutoff) {
            return false;
        }

        return true;
    }

    let mapSet = (set) => {
        if (!set) {
            return null;
        }

        return {
            name: set.name,
            code: set.code,
            searchUri: set.search_uri,
            releasedOn: new Date(set.released_at)
        }
    }

    let getByCode = (code) => {
        return db.sets().findOne({code: code})
        .then(set => {
            if (set !== null) {
                return set;
            }

            return getAll().then(sets => sets.filter(set => set.code.toLowerCase() === code.toLowerCase())[0]);
        });
    }

    let getKnown = () => {
        return db.sets().find().toArray();
    }

    let getAll = () => {
        return cache.get("set", () => {
            return http.get(baseUri)
            .then(response => JSON.parse(response).data)
            .then(sets => sets.filter(filterSet))
            .then(sets => sets.map(mapSet));
        });
    }

    let getUnknown = () => {
        let knownSets = null;
        let allSets = null;

        let knownSetsPromise = getKnown().then(x => knownSets = x);
        let allSetsPromise = getAll().then(x => allSets = x);

        return Promise.all([knownSetsPromise, allSetsPromise])
        .then(() => {
            return allSets.filter(set => {
                return !knownSets.some(x => x.code === set.code);
            });
        });
    }

    let save = (set) => {
        return db.sets().findOneAndUpdate({code: set.code}, set, {upsert: true});
    }

    return {
        getByCode: getByCode,
        getAll: getAll,
        getKnown: getKnown,
        getUnknown: getUnknown,
        save: save
    }
}();