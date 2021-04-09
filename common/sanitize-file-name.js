module.exports = class SanitizeFileName {
    static sanitizeFileName(fileName) {
        return fileName.replace(/[<>:"/\|?*]/g,"");
    }
}