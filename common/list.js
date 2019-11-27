module.exports = class List {
    static groupBy(array, keyfunc) {
        let groups = array.reduce((groups, item) => {
            let key = keyfunc(item);
            groups[key] = groups[key] || [];
            groups[key].push(item);
            return groups;
        }, {});
        return Object.keys(groups).map(key => groups[key]);
    }

    static first(array) {
        return array[0];
    }
}