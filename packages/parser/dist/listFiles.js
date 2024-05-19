'use strict';

var path = require('path');
var fs = require('fs');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**返回从根目录包括packages下的对应app的文件结构
 * dirPath 文件夹绝对路劲
 * excludes 排除的子文件夹名称
 */
function scanDir(dirPath) {
    return __awaiter(this, void 0, void 0, function () {
        var subDirs, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs__namespace.promises.readdir(dirPath)];
                case 1:
                    subDirs = _a.sent();
                    res = [];
                    return [4 /*yield*/, waitAllTaks(subDirs, function (subDir) {
                            return __awaiter(this, void 0, void 0, function () {
                                var subdirPath, stats, content, item, children, err_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(subDir !== 'node_modules' && !subDir.startsWith('.'))) return [3 /*break*/, 8];
                                            subdirPath = path__namespace.resolve(dirPath, subDir);
                                            return [4 /*yield*/, fs__namespace.promises.stat(subdirPath)];
                                        case 1:
                                            stats = _a.sent();
                                            content = '';
                                            if (!stats.isFile()) return [3 /*break*/, 3];
                                            return [4 /*yield*/, fs__namespace.promises.readFile(subdirPath, { encoding: 'utf8' })];
                                        case 2:
                                            content = _a.sent();
                                            _a.label = 3;
                                        case 3:
                                            item = {
                                                name: subDir,
                                                type: stats.isDirectory() ? 'dir' : 'file',
                                                content: content,
                                                children: []
                                            };
                                            res.push(item);
                                            _a.label = 4;
                                        case 4:
                                            _a.trys.push([4, 7, , 8]);
                                            if (!stats.isDirectory()) return [3 /*break*/, 6];
                                            return [4 /*yield*/, scanDir(subdirPath)];
                                        case 5:
                                            children = _a.sent();
                                            item.children = children;
                                            _a.label = 6;
                                        case 6: return [3 /*break*/, 8];
                                        case 7:
                                            err_1 = _a.sent();
                                            console.error(err_1);
                                            return [3 /*break*/, 8];
                                        case 8: return [2 /*return*/];
                                    }
                                });
                            });
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, res];
            }
        });
    });
}
function waitAllTaks(items, fn) {
    var promises = [];
    items.forEach(function (i) {
        promises.push(fn(i));
    });
    return Promise.all(promises);
}
function getNodeModules(nodeModulesRootPath, prefix) {
    return __awaiter(this, void 0, void 0, function () {
        var librariesNames, result;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs__namespace.promises.readdir(nodeModulesRootPath)];
                case 1:
                    librariesNames = _a.sent();
                    result = {
                        nodeModules: [],
                        absolutePathMap: {}
                    };
                    return [4 /*yield*/, waitAllTaks(librariesNames, function (libraryName) { return __awaiter(_this, void 0, void 0, function () {
                            var libraryFakePath, libraryRealpath, getChildrenNodeModules, libraryItem;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        libraryFakePath = path__namespace.resolve(nodeModulesRootPath, libraryName);
                                        return [4 /*yield*/, fs__namespace.promises.realpath(libraryFakePath)];
                                    case 1:
                                        libraryRealpath = _a.sent();
                                        getChildrenNodeModules = function (curLibraryRealPath) { return __awaiter(_this, void 0, void 0, function () {
                                            var libraryName, fakeDirPath, peers, dependancyLibrary, files, shortRealPath;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        libraryName = curLibraryRealPath.split('/').pop();
                                                        fakeDirPath = path__namespace.resolve(curLibraryRealPath, '..');
                                                        return [4 /*yield*/, fs__namespace.promises.readdir(fakeDirPath)];
                                                    case 1:
                                                        peers = _a.sent();
                                                        dependancyLibrary = [];
                                                        return [4 /*yield*/, waitAllTaks(peers, function (peerName) {
                                                                return __awaiter(this, void 0, void 0, function () {
                                                                    var peerFakePath, peerRealPath, library;
                                                                    return __generator(this, function (_a) {
                                                                        switch (_a.label) {
                                                                            case 0:
                                                                                if (!(peerName !== libraryName)) return [3 /*break*/, 3];
                                                                                peerFakePath = path__namespace.resolve(fakeDirPath, peerName);
                                                                                return [4 /*yield*/, fs__namespace.promises.realpath(peerFakePath)];
                                                                            case 1:
                                                                                peerRealPath = _a.sent();
                                                                                return [4 /*yield*/, getChildrenNodeModules(peerRealPath)];
                                                                            case 2:
                                                                                library = _a.sent();
                                                                                dependancyLibrary.push(library);
                                                                                _a.label = 3;
                                                                            case 3: return [2 /*return*/];
                                                                        }
                                                                    });
                                                                });
                                                            })];
                                                    case 2:
                                                        _a.sent();
                                                        return [4 /*yield*/, scanDir(curLibraryRealPath)];
                                                    case 3:
                                                        files = _a.sent();
                                                        shortRealPath = curLibraryRealPath.slice(prefix.length);
                                                        result.absolutePathMap[shortRealPath] = files;
                                                        return [2 /*return*/, {
                                                                realpath: shortRealPath,
                                                                dependancyLibrary: dependancyLibrary
                                                            }];
                                                }
                                            });
                                        }); };
                                        return [4 /*yield*/, getChildrenNodeModules(libraryRealpath)];
                                    case 2:
                                        libraryItem = _a.sent();
                                        result.nodeModules.push(libraryItem);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
function listFiles(projectPath, pnpmPath) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        scanDir(projectPath),
                        getNodeModules(path__namespace.resolve(projectPath, 'node_modules'), pnpmPath)
                    ])];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, { src: res[0], nodeModules: res[1] }];
            }
        });
    });
}

exports.getNodeModules = getNodeModules;
exports.listFiles = listFiles;
exports.scanDir = scanDir;
