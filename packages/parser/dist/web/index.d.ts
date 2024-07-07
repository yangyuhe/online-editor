import './global-variables.js';
import { MsgType } from '../common/types.js';
export declare function tunnelTask<Type>(msgType: MsgType, msgData: any, sw: ServiceWorker): Promise<any>;
export declare const onReady: Promise<unknown>;
