/**message类型 */
export var MsgType;
(function (MsgType) {
    /**web端通知sw加载文件系统 */
    MsgType["Init"] = "Init";
    /**sw请求web端解析commonjs模块 */
    MsgType["GetModule"] = "GetModule";
    /**获取文件的内容 */
    MsgType["GetFileContent"] = "GetFileContent";
    /**sw端通知web文件系统已经获取完毕 */
    MsgType["InitDone"] = "initDone";
    /**对之前请求的响应 */
    MsgType["Echo"] = "Echo";
    /**web端请求sw端计算绝对路径 */
    MsgType["CalcuPath"] = "CalcuPath";
})(MsgType || (MsgType = {}));
export var PathPrefix;
(function (PathPrefix) {
    PathPrefix["SRC"] = "/$$SRC";
    PathPrefix["NODE_MODULES"] = "/$$NODE_MODULES";
    PathPrefix["PUBLIC"] = "/$$PUBLIC";
})(PathPrefix || (PathPrefix = {}));
