import { app_name_id } from './config';
import type { IDBPDatabase, IDBPTransaction } from 'idb';

// config
export const db_name = app_name_id + '_web-data_'// + globalThis.location.pathname.replace(/(\/|\\|\:|\;|\"|\'|\+|\=|\[|\]|\(|\)|\,|\.)/g, '_');
export const version = 2;


import { openDB, unwrap } from 'idb';


const el_dbExpired = globalThis.document?.createElement('dialog');
if (globalThis.document) {
    el_dbExpired.innerHTML = `
<div style="font-weight: bold; font-size: large;">The database has expired.</div>
<div style="font-size: smaller; color: gray; font-family: monospace;" data-content></div>
<div>
    <span>Please</span>
    <a href="javascript:" onclick="globalThis.location.reload()">reload the page</a>
    <span>to continue.</span>
</div>
`;
    el_dbExpired.oncancel = () => false;
    (document.body || document.documentElement).append(el_dbExpired);
}


interface UpgradeFunction {
    (db: IDBPDatabase, transaction: IDBPTransaction, oldVersion: number): void;
}

const dbUpgrade: Record<number, UpgradeFunction> = {
    0(db, t, old) {
        db.createObjectStore('config', { autoIncrement: true });
    },
    1(db, t, old) {
        db.createObjectStore('files');
    },
};


/**@type {import('idb').IDBPDatabase} */
let db!: import('idb').IDBPDatabase;
await new Promise<void>(function (resolve, reject) {
    openDB(db_name, version, {
        // @ts-ignore
        upgrade(db: IDBPDatabase, oldVersion: number, newVersion: number | null, transaction: IDBPTransaction, event: IDBVersionChangeEvent) {
            if (newVersion === null) newVersion = 1;
            for (let version = oldVersion; version < newVersion; ++version) {
                if (dbUpgrade[version]) {
                    const _ = dbUpgrade[version].call(db, db, transaction, oldVersion);
                }
            }
        },
        blocked(currentVersion, blockedVersion, event) {
            reject(`Failed to open database ${db_name}: blocked: currentVersion = ${currentVersion}, blockedVersion = ${blockedVersion}`)
        },
        blocking(currentVersion, blockedVersion, event) {
            db.close();
            // @ts-ignore
            (el_dbExpired.querySelector('[data-content]') || {}).innerText = `currentVersion = ${currentVersion}, blockedVersion = ${blockedVersion}`;
            el_dbExpired.showModal();
        },
        terminated() {
            // …
        },
    })
    .then(function (result) {
        db = result;
        resolve();
    })
    .catch(reject);
    
    setTimeout(() => reject('Timeout while opening idb'), 10000);
});






export { db };





// // ==== BrowserFS ====
// import * as BrowserFS from 'browserfs';
// import type { FSModule } from 'browserfs/dist/node/core/FS';
// export const BFS_config = {
//     fs: 'HTML5FS',
//     options: {
//         storeName: app_name_id + "_files",
//         size: 256 * 1024 * 1024,
//     }
// };
// export const fs: FSModule = await new Promise((resolve) => {
//     // @ts-ignore
//     BrowserFS.configure(BFS_config, function (err) {
//         if (err) {
//             console.error('BrowserFS initialization failed:', err);
// //             const dlg = document.createElement('dialog');
// //             dlg.innerHTML = `
// // <div style="font-weight: bold; font-size: large;">BrowserFS initialization failed:</div>
// // <div style="font-size: smaller; color: gray; font-family: monospace;" data-content></div>
// // <div>
// //     <span>Please</span>
// //     <a href="javascript:" onclick="globalThis.location.reload()">reload the page</a>
// //     <span>to try again.</span>
// // </div>
// // `;
// //             dlg.oncancel = () => false;
// //             (document.body || document.documentElement).append(dlg);
// //             (dlg.querySelector('[data-content]') as HTMLElement).innerText = String(err);
// //             dlg.showModal();
// //             dlg.addEventListener('close', () => {
// //                 globalThis.location.reload();
//             //             });
//             // @ts-ignore   
//             resolve(null);
//         }
//         resolve(BrowserFS.BFSRequire('fs'));
//     });
// });
    
// ZenFS
import { configure } from '@zenfs/core';
import { IndexedDB, WebAccess } from '@zenfs/dom';

// class FakeIDBObjectStore {
//     constructor(private db: IDBPDatabase, public name: string, public version: number) {
        
//     }
    
//     transaction(storeName: string, mode: IDBTransactionMode) {
//         return new Proxy(this.db.transaction(storeName, mode), {
//             get(tx_target, prop, receiver) {
//                 const r = Reflect.get(tx_target, prop, receiver);
//                 if (typeof r === 'function') return new Proxy(r, {
//                     apply(target, thisArg, argumentsList) {
//                         const promiseResult = Reflect.apply(target, tx_target.db, argumentsList);
//                         if (!(promiseResult instanceof Promise)) return promiseResult;
//                         let os: any, oe: any;
//                         promiseResult.then(
//                             (value: any) => os?.call(this, value),
//                             (reason: any) => oe?.call(this, reason),
//                         );
//                         return {
//                             get onsuccess() { return os; },
//                             set onsuccess(value) { os = value; },
//                             get onerror() { return oe; },
//                             set onerror(value) { oe = value; },
//                         }
//                     },
//                 });
//                 return r;
//             },
//         });
//     }
// };

const __Factory = {
    open(name: string, ver: number) {
        let onsuccess: null | ((this: any, event: Event) => void) = null;

        // const fakeStore = new FakeIDBObjectStore(db, name, ver);
        // const wrapped = new Proxy(fakeStore, {
        //     get(target, prop, receiver) {
        //         return Reflect.get(target, prop, receiver);
        //     },
        // });
        const wrapped = new Proxy(unwrap(db), {
            get(db_target, prop, receiver) {
                if (prop === 'name') return 'files';
                const r = Reflect.get(db_target, prop, receiver);
                if (typeof r === 'function') return new Proxy(r, {
                    apply(target, __unused, argumentsList) {
                        return Reflect.apply(target, db_target, argumentsList);
                    },
                });
                return r;
            },
        });

        return {
            get onsuccess() { return onsuccess; },
            set onsuccess(value) { onsuccess = value; queueMicrotask(() => onsuccess?.call(this, new Event('success'))); },
            get onerror() { return null; },
            set onerror(value) { /* ignore */ },
            get onupgradeneeded() { return null; },
            set onupgradeneeded(value) { /* ignore */ },
            get onblocked() { return null; },
            set onblocked(value) { /* ignore */ },
            get result() { return wrapped; },
        };
    },
};
const fakeIDBFactory = new Proxy(Object.create(IDBFactory.prototype), {
    get(target, prop, receiver) {
        if (Reflect.has(__Factory, prop)) return Reflect.get(__Factory, prop);
        return Reflect.get(target, prop, receiver);
    },
});


await configure({
    disableAccessChecks: true,
    mounts: {
        '/': await IndexedDB.create({
            storeName: "files",
            idbFactory: fakeIDBFactory,
        }),
        // '/': await WebAccess.create({
        //     handle: await new Promise((resolve, reject) => {
        //         const dlg = document.createElement('dialog');
        //         dlg.innerHTML = `<button>Grant access</button>`;
        //         dlg.oncancel = () => false;
        //         (document.body || document.documentElement).append(dlg);
        //         dlg.showModal();
        //         dlg.querySelector('button')?.addEventListener('click', async () => {
        //             try {
        //                 const handle = await window.showDirectoryPicker({
        //                     mode: 'readwrite',
        //                 });
        //                 resolve(handle);
        //             } catch (err) {
        //                 reject(err);
        //             } finally {
        //                 dlg.close()
        //                 dlg.remove()
        //             }
        //         });
        //     })
        // }),
    }
});

export * as fs from '@zenfs/core/promises';
