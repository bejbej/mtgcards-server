module.exports = function () {
    require('env2')('./env.json');
    const { union } = require("../common/list.js");
    let MongoClient = require("mongoDB");
    let client;

    this.init = async () => {
        client = await MongoClient.connect(process.env.database, { useUnifiedTopology: true });
    }

    this.destroy = async () => {
        client.destroy();
        delete client;
    }

    this.getCardsByQuery = async (query) => {
        return await client.db("mtgcards").collection("cards").find(query).toArray();
    }

    this.getSetsByQuery = async (query) => {
        return await client.db("mtgcards").collection("sets").find(query).toArray();
    }

    this.insertOrUpdateCard = async (card) => {
        const cards = client.db("mtgcards").collection("cards");
        const existingCard = await cards.findOne({ name: card.name });

        if (existingCard) {
            const printings = union(existingCard.printings, card.printings, x => x.scryfallId);
            if (printings.length !== existingCard.printings.length) {
                await cards.updateOne({ name: card.name }, { $set: { printings: printings } });
            }
        }
        else {
            await cards.insertOne(card);
        }
    }

    this.insertSet = async (set) => {
        const sets = client.db("mtgcards").collection("sets");
        const existingSet = await sets.findOne({ name: set.name });
        if (!existingSet) {
            await sets.insertOne(set);
        }
    }
}