/**
 * moduleRequired 模块的绝对路径
 */
export async function loadModule(moduleRequired) {
    const requiredModule = moduleRequired.endsWith(".js") ? moduleRequired : (moduleRequired + '.js')
    if (!window[requiredModule]) {

        window[requiredModule] = new Promise(async (resolve, reject) => {
            try {

                if (/\.(j|t)sx$/.test(requiredModule)) {
                    const res = await loadEs(requiredModule)
                    resolve(res);
                    return;
                }
                const res = await fetch(requiredModule + '?content')
                if (res.status !== 404) {
                    const text = await res.text()
                    if (isEs6(text)) {
                        const res = await loadEs(requiredModule)
                        resolve(res);
                        return
                    } else {
                        const code = (Babel.transform(text, { plugins: ['commonAsync'] })).code;
                        const AsyncFunction = (async () => { }).constructor
                        const fn = new AsyncFunction('module', 'exports', 'require', 'process', code)
                        const module = { exports: {} }
                        const process = {
                            env: {
                                NODE_ENV: 'development'
                            }
                        }
                        await fn(module, module.exports, async (module) => {
                            if (module.startsWith('/')) {
                                return loadModule(module)
                            }
                            if (module.startsWith('./') || module.startsWith('../')) {
                                const paths = module.split("/")
                                const desPaths = requiredModule.split("/")
                                desPaths.pop()
                                while (true) {
                                    let cur = paths.shift()
                                    if (cur === undefined) break;
                                    if (cur === '.') {
                                        continue;
                                    }
                                    if (cur === '..') {
                                        desPaths.pop()
                                        continue;
                                    }
                                    desPaths.push(cur);
                                }

                                return loadModule(desPaths.join("/"))
                            }
                            const res = await fetch("/api/file?module=" + module)
                            const json = await res.json()
                            if (json.data)
                                return loadModule(location.origin + json.data.file);
                            else
                                throw new Error("没有找到依赖的子模块" + module)

                        }, process);
                        resolve(module.exports);
                        return;
                    }
                } else {
                    reject(new Error("not found " + requiredModule))
                }

            } catch (err) {
                reject(err);
            }
        })
        let finish = false;
        window[requiredModule].finally(() => {
            finish = true;
        })
        setTimeout(() => {
            if (!finish)
                console.error(`模块${requiredModule}加载超时`)
        }, 10000);
    }
    return window[requiredModule]
}

function isEs6(text) {
    const es6 = text
        .split('\n')
        .some((line) => line.startsWith('export ') || text.startsWith('import '));
    return es6;
}