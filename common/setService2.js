module.exports = function () {
    const http = require("request-promise");
    const db = require("../db/db.js");
    const cache = require("../common/cache.js");
    const List = require("../common/list.js");

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
        "4bb"
    ];

    let filterSet = (set) => {
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

    let mapSet = (set) => {
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

    let getByCode = async (code) => {
        let set = await db.sets().findOne({code: code})
        if (set !== null) {
            return set;
        }

        let allSets = await getAll();
        return List.first(allSets.filter(set => set.code.toLowerCase() === code.toLowerCase()));
    }

    let getKnown = () => {
        return db.sets().find().toArray();
    }

    let getAll = () => {
        return cache.get("set", async () => {
            let response = await http.get(baseUri);
            let sets = JSON.parse(response).data;
            let filteredSets = sets.filter(filterSet);
            let mappedSets = filteredSets.map(mapSet);
            return mappedSets;
        });
    }

    let getUnknown = async () => {
        let knownSetsPromise = getKnown();
        let allSetsPromise = getAll();
        let knownSets = await knownSetsPromise;
        let allSets = await allSetsPromise;
        return allSets.filter(set => {
            return !knownSets.some(x => x.code === set.code);
        });
    }

    let save = (set) => {
        return db.sets().replaceOne({code: set.code}, set, {upsert: true});
    }

    return {
        getByCode: getByCode,
        getAll: getAll,
        getKnown: getKnown,
        getUnknown: getUnknown,
        save: save
    }
}();