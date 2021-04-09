module.exports = class {
    static printSets = (sets) => {
        sets.sort((a,b) => a.name > b.name ? 1 : -1);

        for (let i = 0; i < sets.length; ++i) {
            const set = sets[i];
            console.log(`${i+1}\t${set.code}\t${set.name}\t${set.set_type}\t${set.released_at}`);
        }
    }
}