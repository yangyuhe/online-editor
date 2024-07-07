import '@/common/babel-plugin';
import * as Babel from '@babel/standalone';
import { MsgType } from '../common/types';
import { tunnelTask } from '.';
/**
 * moduleRequired 模块的绝对路径
 */
export async function loadModule(requiredModule, sw) {
    if (!window[requiredModule]) {
        window[requiredModule] = new Promise(async (resolve, reject) => {
            try {
                if (/\.(j|t)sx$/.test(requiredModule)) {
                    const res = await import(requiredModule);
                    resolve(res);
                    return;
                }
                const text = await tunnelTask(MsgType.GetFileContent, requiredModule, sw);
                if (isEs6(text)) {
                    const res = await import(requiredModule);
                    resolve(res);
                    return;
                }
                else {
                    const code = Babel.transform(text, { plugins: ['commonAsync'] }).code;
                    const AsyncFunction = (async () => { }).constructor;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    const fn = new AsyncFunction('module', 'exports', 'require', code);
                    const module = { exports: {} };
                    await fn(module, module.exports, async (module) => {
                        //requiredModule如http://localhost:3000/old-react-test/$$NODE_MODULES/react@16.14.0/node_modules/react/index.js
                        //module如./cjs/react.development.js
                        const absolutePath = await tunnelTask(MsgType.CalcuPath, { curPath: requiredModule, requiredModule: module }, sw);
                        if (absolutePath)
                            return loadModule(new URL(requiredModule).origin + absolutePath, sw);
                        else
                            throw new Error('没有找到依赖的子模块' + module);
                    });
                    resolve(module.exports);
                    return;
                }
            }
            catch (err) {
                reject(err);
            }
        });
        let finish = false;
        window[requiredModule].finally(() => {
            finish = true;
        });
        setTimeout(() => {
            if (!finish)
                console.error(`模块${requiredModule}加载超时`);
        }, 10000);
    }
    return window[requiredModule];
}
function isEs6(text) {
    const es6 = text
        .split('\n')
        .some((line) => line.startsWith('export ') || text.startsWith('import '));
    return es6;
}
