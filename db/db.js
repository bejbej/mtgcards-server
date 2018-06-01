module.exports = function () {
    let MongoClient = require("mongoDB");
    let db;

    let cards = () => {
        return db.collection("cards");
    }

    let sets = () => {
        return db.collection("sets");
    }

    var init = async (connectionString) => {
        let client = await MongoClient.connect(process.env.database);
        db = client.db("mtgcards");
    }

    return {
        cards: cards,
        sets: sets,
        init: init
    };
}();