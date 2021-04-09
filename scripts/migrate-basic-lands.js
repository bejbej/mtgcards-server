(async () => {
    const { getCardById } = require("../common/scryfall-dal.js");
    const { saveCards } = require("../common/card-dal.js");

    const plains = await getCardById("cc3db531-3f21-49a2-8aeb-d98b7db94397");
    const island = await getCardById("91595b00-6233-48be-a012-1e87bd704aca");
    const swamp = await getCardById("8e5eef83-a3d4-44c7-a6cb-7f6803825b9e");
    const mountain = await getCardById("6418bc71-de29-410c-baf3-f63f5615eee2");
    const forest = await getCardById("146b803f-0455-497b-8362-03da2547070d");

    await saveCards([plains, island, swamp, mountain, forest]);
})();