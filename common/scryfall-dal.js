const http = require("request-promise");
const { groupBy } = require("./list.js");
const { hasPrimaryType } = require("../common/card-parser.js");

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
    "rin",  // Foreign Language
    "fbb",  // Foreign Language
    "4bb",
    "mznr"
];

const basicLandNames = [
    "Plains",
    "Island",
    "Swamp",
    "Mountain",
    "Forest"
]


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

module.exports = class ScryfallDal {

    static async getAllSets() {
        const baseUri = "https://api.scryfall.com/sets";

        const response = await http.get(baseUri);
        const sets = JSON.parse(response).data;
        const filteredSets = sets.filter(filterSet);
        return filteredSets;
    }

    static async getSetByCode(code) {
        const uri = `https://api.scryfall.com/sets/${code}`;
        const response = await http.get(uri);
        const set = JSON.parse(response);
        return set;
    }

    static async getCardById(id) {
        const uri = `https://api.scryfall.com/cards/${id}`;
        const response = JSON.parse(await http.get(uri));
        return response;
    }

    static async getCardsByUri(uri) {
        const responses = [];
        
        do {
            const start = new Date();
            const response = JSON.parse(await http.get(uri));
            const end = new Date();
            console.log(`scryfall ${end - start}ms`);
            responses.push(response.data);
            uri = response.next_page;
        } while (uri);

        const cards = responses.flat();
        const filteredCards = cards
            .filter(card => hasPrimaryType(card))
            .filter(card => !basicLandNames.some(basicLandName => basicLandName === card.name));
        return filteredCards;
    }
}