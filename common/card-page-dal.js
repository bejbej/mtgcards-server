const fs = require("fs").promises;
const { sanitizeFileName } = require("./sanitize-file-name.js");
const { determineName } = require("./card-parser");

const generateHtml = (card) => {
    const name = `<p>${card.name} ${card.mana_cost}</p>`
    const type = `<p>${card.type_line}</p>`;
    const text = card.oracle_text ? card.oracle_text.split("\n").map(text => `<p>${text}</p>`).join("") : "";
    const powerAndToughness = card.power ? `<p>${card.power}/${card.toughness}</p>` : "";
    const loyalty = card.loyalty ? `<p>${card.loyalty}<p>` : "";
    const content = `${name}${type}${text}${powerAndToughness}${loyalty}`;
    return content;
}

const doStuff = (card) => {
    if (card.card_faces) {
        return card.card_faces.map(card => generateHtml(card)).join("<p>//</p>");
    }

    return generateHtml(card);
}

module.exports = class CardPageDal {

    static async saveCardPage(card) {
        const fileName = `${__dirname}/../data/cardPages/${sanitizeFileName(determineName(card))}.html`;
        const style = "<style>body{font-family:sans-serif;font-size:10px}</style>";

        const body = doStuff(card);
        const html = `${style}${body}`;

        await fs.writeFile(fileName, html);
    }
}