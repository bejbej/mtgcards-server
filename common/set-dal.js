const fs = require("fs").promises;
const { sanitizeFileName } = require("./sanitize-file-name.js");
const setDirName = __dirname + "/../data/sets";

module.exports = class SetDal {
    static async getAllSets() {
        const fileNames = await fs.readdir(setDirName);
        const files = await Promise.all(fileNames.map(fileName => fs.readFile(`${setDirName}/${fileName}`)));
        return files.map(x => JSON.parse(x));
    }

    static async saveSet(set) {
        const fileName = `${setDirName}/${sanitizeFileName(set.name)}.json`;
        const text = JSON.stringify(set, null, 2);
        fs.writeFile(fileName, text);
    }
}