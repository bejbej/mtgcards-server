const Cache = function (expiration) {

    const cache = {};

    this.get = (key, func) => {
        var item = cache[key];

        if (item !== undefined) {
            if (item.expirationDate > new Date().getTime()) {
                return item.value;
            }

            delete cache[key];
        }

        const value = func();
        const now = new Date();
        const expirationDate = now.setSeconds(now.getSeconds() + expiration);
        cache[key] = { value: value, expirationDate: expirationDate };
        return value;
    }
}

module.exports = {
    Cache: Cache
};