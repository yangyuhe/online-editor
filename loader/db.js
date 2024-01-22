define([], () => {
    const openRequest = indexedDB.open("modules", 1)
    let db;
    openRequest.onsuccess = function () {
        db = openRequest.result;
    };
    openRequest.onupgradeneeded = function () {
        let db = openRequest.result;
        if (!db.objectStoreNames.contains('items')) {
            db.createObjectStore('items', { keyPath: 'id' });
        }
    };
    return {
        getItem(moduleName) {
            return new Promise((resolve, reject) => {
                if (!db) throw new Error("db not initialized")
                let transaction = db.transaction("items", "readonly");
                let items = transaction.objectStore("items");
                let request = items.get(moduleName)
                request.onsuccess = function () {
                    if (request.result) {
                        resolve(request.result.data)
                    } else {
                        reject(new Error("not found"))
                    }
                };
                request.onerror = function () {
                    reject(request.error)
                }
            })

        },
        setItem(moduleName, data) {
            if (!db) return;
            let transaction = db.transaction("items", "readwrite");
            let items = transaction.objectStore("items");
            let item = {
                id: moduleName,
                data
            }
            let request = items.add(item)
            request.onerror = function () {
                console.error(moduleName)
                console.error('db error:', request.error)
            }
        }
    }
})