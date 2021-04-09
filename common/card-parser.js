const typeMapping = {
    "conspiracy": "conspracy",
    "creature": "creature",
    "summon": "creature",
    "autobot character": "creature",
    "eaturecray": "creature",
    "land": "land",
    "artifact": "artifact",
    "enchantment": "enchantment",
    "planeswalker": "planeswalker",
    "instant": "instant",
    "sorcery": "sorcery"
}

const colorMapping = {
    "W": "white",
    "U": "blue",
    "B": "black",
    "R": "red",
    "G": "green"
}

const determinePrimaryType = (card) => {
    const layouts = [
        "split",
        "modal_dfc",
        "transform"
    ];

    if (card.layout.indexOf("token") > -1) {
        return null;
    }

    const typeLine = layouts.some(layout => layout === card.layout) ? card.card_faces["0"].type_line : card.type_line;
    const typeKeys = Object.keys(typeMapping);
    for (let i = 0; i < typeKeys.length; ++i) {
        const typeKey = typeKeys[i];
        if (typeLine.toLowerCase().indexOf(typeKey) > -1) {
            return typeMapping[typeKey];
        }
    }

    return null;
}

module.exports = class CardParser {
    
    static determineName(card) {
        const layouts = [
            "transform",
            "flip"
        ];

        return layouts.some(layout => layout === card.layout) ? card.card_faces["0"].name : card.name;
    }

    static determineColor(card) {
        const layouts = [
            "modal_dfc",
            "transform"
        ];

        const primaryFace = layouts.some(layout => layout === card.layout) ? card.card_faces["0"] : card;

        switch (primaryFace.colors.length) {
            case 0:
                return "colorless"
            case 1:
                return colorMapping[primaryFace.colors];
            default:
                return "multicolored";
        }
    }

    static hasPrimaryType(card) {
        return determinePrimaryType(card) !== null;
    }

    static determinePrimaryType(card) {
        const primaryType = determinePrimaryType(card);

        if (primaryType !== null) {
            return primaryType;
        }

        throw new Error(`Can't determine the card type of ${card.type_line} for ${card.name}`);
    }

    static determineImageUri(card) {
        const layouts = [
            "modal_dfc",
            "transform"
        ];

        const primaryFace = layouts.some(layout => layout === card.layout) ? card.card_faces["0"] : card;
        const [, imageUri ] = /front\/([^\.]+)\.jpg/.exec(primaryFace.image_uris.border_crop);
        return imageUri;
    }
}