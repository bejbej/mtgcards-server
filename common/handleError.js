module.exports = (response, reason, message, code) => {
    console.log("ERROR: " + reason);
    response.status(code || 500).json({ "error": message });
}