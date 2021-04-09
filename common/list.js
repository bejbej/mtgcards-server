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

    static toDictionary(array, keyFunc) {
        const dictionary = array.reduce((dictionary, item) => {
            dictionary[keyFunc(item)] = item;
            return dictionary;
        }, {});
        return dictionary;
    }

    static toList(dictionary) {
        return Object.keys(dictionary).map(key => dictionary[key]);
    }

    static first(array, keyFunc) {
        keyFunc = keyFunc || (() => true);

        for (var i = 0; i < array.length; ++i) {
            const item = array[i];
            if (keyFunc(item)) {
                return item;
            }
        }

        throw new Error("Array doesn't contain a matching element");
    }

    static single(array) {
        if (array.length !== 1) {
            throw new Error("Array doesn't contain exactly one elemet.");
        }

        return array[0];
    }

    static unique(array, keyFunc) {
        const dictionary = List.toDictionary(array, keyFunc);
        return List.toList(dictionary);
    }

    static union(array1, array2, keyFunc) {
        const union = array1.concat(array2);
        return List.unique(union, keyFunc);
    }

    static except(sourceArray, exceptedArray, keyFunc) {
        const exceptedKeys = List.toDictionary(exceptedArray, keyFunc);
        return sourceArray.filter(x => !exceptedKeys[keyFunc(x)]);
    }
}