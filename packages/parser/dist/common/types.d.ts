/**包括src和node_modules的总的文件夹和文件 */
export type FsData = {
    source: FileItem[];
    modules: {
        [realpath: string]: ModulesData;
    };
};
/**node_modules的文件夹和文件 */
export type ModulesData = {
    /**名称 */
    packageName: string;
    /**依赖库 */
    dependancyModules: {
        packageName: string;
        realpath: string;
    }[];
    /**库的内容 */
    dirs: FileItem[];
    /**路径 */
    realpath: string;
    /**是否是被直接依赖的库 */
    isRoot: boolean;
};
/**文件夹和文件 */
export type FileItem = {
    type: 'dir' | 'file';
    name: string;
    content: string;
    children: FileItem[];
    parent?: FileItem;
};
/**message类型 */
export declare enum MsgType {
    /**web端通知sw加载文件系统 */
    Init = "Init",
    /**sw请求web端解析commonjs模块 */
    GetModule = "GetModule",
    /**获取文件的内容 */
    GetFileContent = "GetFileContent",
    /**sw端通知web文件系统已经获取完毕 */
    InitDone = "initDone",
    /**文件系统更新 */
    Update = "Update",
    /**对之前请求的响应 */
    Echo = "Echo",
    /**web端请求sw端计算绝对路径 */
    CalcuPath = "CalcuPath"
}
/**消息体 */
export type Msg = {
    /**消息类型 */
    msgType: MsgType;
    /**消息内容 */
    msgData?: any;
    /**消息唯一标识，用于获取消息响应结果的 */
    msgKey?: string;
    /**client的url,worker中使用这个标识来判断消息的发送目标 */
    from: 'sw' | (string & {});
    target: 'sw' | (string & {});
};
export declare enum PathPrefix {
    SRC = "/$$SRC",
    NODE_MODULES = "/$$NODE_MODULES",
    PUBLIC = "/$$PUBLIC"
}
