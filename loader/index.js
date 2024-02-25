import { loadModule } from "./require.js"

let init;
export function onReady(cb) {
    init = cb;
}

const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(
                '/sw.js', { type: "module" }
            );
        } catch (error) {
            console.error(`注册serviceworker失败`, error);
        }
    }
};
registerServiceWorker()

navigator.serviceWorker.ready.then(registration => {
    registration.active.postMessage({ type: 'clearCache' })
    setTimeout(() => {
        init?.()
    }, 0);
})



navigator.serviceWorker.onmessage = async event => {
    const { data } = event
    const registration = await navigator.serviceWorker.ready
    if (data.type === 'getmodule') {
        try {
            await loadModule(data.module)

            const moduleExports = await window[data.module]
            registration.active.postMessage({ type: 'getmodule', module: data.module, code: 0, data: Object.keys(moduleExports) })
        } catch (err) {
            registration.active.postMessage({ type: 'getmodule', module: data.module, code: 1, error: err })
        }

    }
}