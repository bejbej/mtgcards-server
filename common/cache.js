module.exports = function () {

    let expiration = 3600;
    let cache = {};

    let get = (key, func) => {
        var item = cache[key];

        if (item !== undefined) {
            if (item.expirationDate > new Date().getTime()) {
                return Promise.resolve(item.value);
            }

            delete cache[key];
        }

        return func().then(result => {
            let now = new Date();
            let expirationDate = now.setSeconds(now.getSeconds() + expiration);
            cache[key] = { value: result, expirationDate: expirationDate };
            return result;
        });
    }

    return {
        get: get
    }
}();