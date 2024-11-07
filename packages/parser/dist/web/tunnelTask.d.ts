import { MsgType } from '../common/types';
export declare const taskCache: {
    [key: string]: {
        p: Promise<any>;
        resolve: any;
        reject: any;
    };
};
export declare function tunnelTask<Type>(msgType: MsgType, msgData: any, sw: BroadcastChannel): Promise<any>;
