module.exports = (app) => {
    var cardService = require("../common/cardService.js");
    var setService = require("../common/setService.js");

    app.get("/api/cat", (request, response) => {
        return response.status(200).json({ cat: "~(=^..^)" });
    });

    app.get("/api/cards", (request, response) => {
        return cardService.getAll()
        .then(cards => {
            return "name\tprimaryType\tcmc\tcolor\tmultiverseId\n" + cards.map(card => {
                return  card.name + "\t" + card.primaryType + "\t" + card.cmc + "\t" + card.color + "\t" + card.multiverseId + "\n";
            }).sort().join("");
        })
        .then(csv => response.status(200).send(csv));
    });

    app.get("/api/sets", (request, response) => {
        return setService.getKnown()
        .then(sets => response.status(200).json({ count: sets.length, sets: sets.map(set => set.name + " - " + set.code).sort() }));
    });

    app.get("/api/unknownsets", (request, response) => {
        return setService.getUnknown()
        .then(sets => response.status(200).send({ count: sets.length, sets: sets.map(set => set.name + " - " + set.code).sort() }));
    });

    app.post("/api/unknownsets", (request, response) => {
        let limit = request.body.limit || 1;
        return setService.getUnknown()
        .then(sets => sets.slice(0, limit))
        .then(sets => {
            return sets.map(set => {
                return cardService.getByCode(set.code)
                .then(cards => cards.map(cardService.save))
                .then(promises => Promise.all(promises))
                .then(() => setService.save(set));
            });
        })
        .then(promises => Promise.all(promises))
        .then(() => response.status(201).send());
    });

    app.get("/api/sets/:code", (request, response) => {
        return setService.getByCode(request.params.code)
        .then(set => cardService.getByCode(set.code))
        .then(cards => response.status(200).send({ count: cards.length, cards: cards }));
    });

    app.post("/api/sets/:code", (request, response) => {
        return setService.getByCode(request.params.code)
        .then(set => {
            return cardService.getByCode(set.code)
            .then(cards => cards.map(cardService.save))
            .then(promises => Promise.all(promises))
            .then(() => setService.save(set));
        })
        .then(message => response.status(201).send());
    });
}
