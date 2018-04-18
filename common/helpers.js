Array.prototype.unique = function(func) {
    let dictionary = {};
    this.forEach(item => {
        let key = func(item);
        dictionary[key] = item;
    });
    return Object.keys(dictionary).map(key => dictionary[key]);
}

Array.prototype.max = function(func) {
    if (this.length === 1) {
        return this[0];
    }

    let max = this[0];
    for (let i = 1; i < this.length; ++i) {
        max = this[i] > max ? this[i] : max;
    }
    return max;
}