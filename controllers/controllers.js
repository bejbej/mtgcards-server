module.exports = (app) => {
    var db = require("../db/db.js");
    var handleError = require("../common/handleError.js");
    var update = require("../common/cardUpdater.js");

    app.get("/api/cat", (request, response) => {
        response.status(200).json({ cat: "~(=^..^)" });
    });

    app.get("/api/sets", (request, response) => {
        db.Set.find().then(sets => {
            sets = sets.map(set => set.name).sort();
            response.status(200).json(sets);
        }).catch(error => {
            handleError(response, error.message, "Failed to get sets.");
        });
    });

    app.get("/api/cards", (request, response) => {
        db.Card.find({}).then(cards => {
            return "name\tprimaryType\tcmc\tcolor\tmultiverseId\n" + cards.map(card => {
                return  card.name + "\t" + card.primaryType + "\t" + card.cmc + "\t" + card.color + "\t" + card.multiverseId + "\n";
            }).sort().join("");
        }).then(csv => {
            response.status(200).send(csv);
        }).catch(error => {
            handleError(respose, error.message, "Failed to get cards");
        });
    });

    app.get("/api/update/:limit", (request, response) => {
        update.exec(request.params.limit).then(message => {
            console.log(message);
            response.status(201).send(message);
        }).catch(error => {
            console.log(error);
            response.status(500).send(error);
        });
    });
}
