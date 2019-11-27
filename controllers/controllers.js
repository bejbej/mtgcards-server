module.exports = (app) => {
    var cardService2 = require("../common/cardService2.js");
    var setService2 = require("../common/setService2.js");

    app.get("/api/cat", (request, response) => {
        return response.status(200).json({ cat: "~(=^..^)" });
    });

    app.get("/api", (request, response) => {
        let body = {
            "All cards as a CSV": "GET /api/cards",
            "All sets": "GET /api/sets",
            "Unknown sets": "GET /api/sets/unknown",
            "Known sets": "GET /api/sets/known",
            "Get a specific set": "GET /api/sets/code/{code}",
            "Get cards for a specific set": "GET /api/sets/code/{code}/cards",
            "Migrate cards for a specific set": "POST /api/sets/code/{code}/cards",
            "Migrate cards for a specific amount of arbitrary sets": "POST /api/sets/batch/{quantity}/cards"
        };
        response.json(body);
    });

    app.get("/api/cards", async (request, response) => {
        let cards = await cardService2.getAll();
        let csv = "name\tprimaryType\tcmc\tcolor\timageUri\n" + cards.map(card => {
            let imageUri = card.printings.sort((a, b) => a.releasedOn < b.releasedOn ? 1 : -1)[0].imageUri;
            return card.name + "\t" + card.primaryType + "\t" + card.cmc + "\t" + card.color + "\t" + imageUri + "\n";
        }).sort().join("");
        response.status(200).send(csv);
    });

    app.get("/api/sets/all", async (request, response) => {
        let sets = await setService2.getAll();
        response.status(200).json({ count: sets.length, sets: sets });
    });

    app.get("/api/sets/unknown", async (request, response) => {
        let sets = await setService2.getUnknown();
        response.status(200).json({ count: sets.length, sets: sets });
    });

    app.get("/api/sets/known", async (request, response) => {
        let sets = await setService2.getKnown();
        response.status(200).json({ count: sets.length, sets: sets });
    })

    app.get("/api/sets/code/:code", async (request, response) => {
        let set = await setService2.getByCode(request.params.code);
        set ? response.status(200).json(set) : response.status(404).send();
    });

    app.get("/api/sets/code/:code/cards", async (request, response) => {
        let set = await setService2.getByCode(request.params.code);
        let cards = set ? cardService2.getBySet(set) : undefined;
        cards ? response.status(200).json({count: cards.length, cards: cards}) : response.status(404).send();
    });

    app.post("/api/sets/code/:code/cards", async (request, response) => {
        let set = await setService2.getByCode(request.params.code);
        if (!set) {
            response.status(404).send();
            return;
        }
        let cards = await cardService2.getBySet(set);
        await Promise.all(cards.map(cardService2.save));
        await setService2.save(set);
        response.status(204).send();
    });

    app.post("/api/sets/batch/:size/cards", (request, response) => {
        response.status(201).send();
        return setService2.getUnknown()
        .then(sets => sets.slice(0, request.params.size))
        .then(sets => {
            let invoke = (setList) => {
                let start = new Date();
                if (setList.length === 0) {
                    return;
                }
                let set = setList.pop();
                return cardService2.getBySet(set)
                    .then(cards => Promise.all(cards.map(cardService2.save)))
                    .then(() => setService2.save(set))
                    .then(() => {
                        let end = new Date();
                        let elapsed = end.getTime() - start.getTime();
                        console.log(set.name + " - " + elapsed + "ms - " + setList.length + " sets left")
                    })
                    .then(() => invoke(setList));
            }

            return invoke(sets);
        });
    });
}
