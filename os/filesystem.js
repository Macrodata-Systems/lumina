
/**
 * Lumina File System
 * A virtual file system backed by IndexedDB
 */
export class FileSystem {
    constructor() {
        this.dbName = 'LuminaOS';
        this.storeName = 'files';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = (event) => reject('FileSystem error: ' + event.target.error);

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'path' });
                }
            };
        });
    }

    async writeFile(path, content, type = 'text/plain') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const file = {
                path,
                content,
                type,
                lastModified: Date.now()
            };
            const request = store.put(file);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(file);
        });
    }

    async readFile(path) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(path);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                if (request.result) resolve(request.result);
                else reject(new Error('File not found'));
            };
        });
    }

    async deleteFile(path) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(path);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async listFiles(dirPath) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const allFiles = request.result;
                // Filter files that are strictly within the directory
                // This is a naive implementation, a real FS would operate on usage of "/" separators more robustly
                const files = allFiles.filter(f => f.path.startsWith(dirPath) && f.path !== dirPath);
                resolve(files);
            };
        });
    }
}
