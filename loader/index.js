const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(
                '/sw.js'
            );
            if (registration.installing) {
                console.log(registration.installing)
                console.log('Service worker installing');
            } else if (registration.waiting) {
                console.log(registration.waiting)
                console.log('Service worker installed');
            } else if (registration.active) {
                console.log(registration.active)
                console.log('Service worker active');

            }
        } catch (error) {
            console.error(`注册serviceworker失败`, error);
        }
    }
};

navigator.serviceWorker.ready.then(registration => {
    registration.active.postMessage({ type: 'clearCache' })
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

registerServiceWorker()