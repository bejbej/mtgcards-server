module.exports = class AsyncMap {
    static async asyncMap(array, mapFunc, numberOfWorkerProcesses) {
        array = [...array];

        return new Promise((resolve, reject) => {
            numberOfWorkerProcesses = numberOfWorkerProcesses || 1;
            const mappedArray = [];
            let currentIndex = 0;
            let activeWorkerProcesses = 0;

            const startWorkerProcess = async () => {
                if (currentIndex >= array.length) {
                    if (activeWorkerProcesses === 0) {
                        resolve(mappedArray);
                    }

                    return;
                }

                ++activeWorkerProcesses;
                const itemIndex = currentIndex;

                ++currentIndex;
                const item = array[itemIndex];
                try {
                    const mappedItem = await mapFunc(item, itemIndex);
                    mappedArray[itemIndex] = mappedItem;
                }
                catch (e) {
                    reject(e);
                }
                --activeWorkerProcesses;

                startWorkerProcess();
            }

            for (let i = 0; i < numberOfWorkerProcesses; ++i) {
                startWorkerProcess();
            }
        });
    }
}