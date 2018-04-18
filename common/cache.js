module.exports = function () {

    let expiration = 3600;
    let cache = {};

    let get = (key, func) => {
        var item = cache[key];

        if (item !== undefined) {
            if (item.expirationDate > new Date().getTime()) {
                return item.value;
            }

            delete cache[key];
        }

        let value = func();
        let now = new Date();
        let expirationDate = now.setSeconds(now.getSeconds() + expiration);
        cache[key] = { value: value, expirationDate: expirationDate };
        return value;
    }

    return {
        get: get
    }
}();