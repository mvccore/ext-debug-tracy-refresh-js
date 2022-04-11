"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chokidar_1 = tslib_1.__importDefault(require("chokidar"));
var WebDevServer = tslib_1.__importStar(require("web-dev-server"));
var ws_1 = tslib_1.__importDefault(require("ws"));
var App = /** @class */ (function () {
    function App(server) {
        var _newTarget = this.constructor;
        this.static = _newTarget;
        this.httpServer = server;
        this.wsConnections = new Map();
    }
    App.prototype.Start = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.wsServer = new ws_1.default.Server({
                            server: this.httpServer.GetHttpServer()
                        });
                        _b = (_a = this.wsServer).on;
                        _c = ['connection'];
                        return [4 /*yield*/, this.handleWebSocketConnection.bind(this)];
                    case 1:
                        _b.apply(_a, _c.concat([_d.sent()]));
                        this.startServerEndInterval();
                        return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.handleWebSocketConnection = function (socket, request) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var browserTabId, prevWsConnection;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                this.stopServerEndInterval();
                browserTabId = request.GetParam('browserTabId', '-a-z0-9');
                if (this.wsConnections.has(browserTabId)) {
                    prevWsConnection = this.wsConnections.get(browserTabId);
                    clearTimeout(prevWsConnection.stopTimeoutId);
                    prevWsConnection.socket = socket;
                }
                else {
                    this.wsConnections.set(browserTabId, {
                        browserTabId: browserTabId,
                        monitoring: false,
                        socket: socket
                    });
                }
                socket.on('message', function (rawData, isBinary) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var e_1;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, this.handleWebSocketMessage(rawData, socket)];
                            case 1:
                                _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                e_1 = _a.sent();
                                console.error(e_1);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                socket.on('close', this.handleWebSocketClose.bind(this, browserTabId));
                socket.on('error', this.handleWebSocketError.bind(this, browserTabId));
                return [2 /*return*/];
            });
        });
    };
    App.prototype.handleWebSocketMessage = function (rawData, socket) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var sentData, eventName;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sentData = JSON.parse(rawData.toString()), eventName = sentData.eventName;
                        if (!this.wsConnections.has(sentData.browserTabId))
                            return [2 /*return*/]; // console.log('Unknown browser tab id.');
                        if (!(eventName === 'start')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.handleWebSocketMessageStart(sentData)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(eventName === 'stop')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.handleWebSocketMessageStop(sentData)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.handleWebSocketMessageStart = function (data) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var wsConnection;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsConnection = this.wsConnections.get(data.browserTabId);
                        if (!wsConnection.monitoring)
                            wsConnection = this.setUpWsConnectionData(data);
                        if (!wsConnection.monitoring) return [3 /*break*/, 1];
                        this.sendMonitoringStarted(data);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.startMonitoring(data.browserTabId)];
                    case 2:
                        _a.sent();
                        this.sendMonitoringStarted(data);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.sendMonitoringStarted = function (data) {
        var wsConnection = this.wsConnections.get(data.browserTabId);
        wsConnection.socket.send(JSON.stringify({
            browserTabId: wsConnection.browserTabId,
            eventName: 'monitoring',
            monitoringPagesCount: this.getMonitoringPagesCount(),
            locations: wsConnection.locations,
            excludes: data.excludes,
            extensions: data.extensions
        }));
    };
    App.prototype.handleWebSocketMessageStop = function (data) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var wsConnection;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsConnection = this.wsConnections.get(data.browserTabId);
                        return [4 /*yield*/, this.stopMonitoring(wsConnection)];
                    case 1:
                        _a.sent();
                        wsConnection.socket.send(JSON.stringify({
                            browserTabId: data.browserTabId,
                            eventName: 'stopped',
                            monitoringPagesCount: this.getMonitoringPagesCount()
                        }));
                        return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.setUpWsConnectionData = function (data) {
        var wsConnection = this.wsConnections.get(data.browserTabId);
        wsConnection.appRoot = data.appRoot;
        wsConnection.locations = this.completeWsConnectionLocations(data.locations);
        wsConnection.excludeRegExps = this.completeWsConnectionExcludes(data.excludes, data.extensions, data.appRoot);
        return wsConnection;
    };
    App.prototype.completeWsConnectionLocations = function (rawLocations) {
        var e_2, _a, e_3, _b, e_4, _c;
        var result = [], itemStat;
        try {
            for (var _d = tslib_1.__values(rawLocations.entries()), _e = _d.next(); !_e.done; _e = _d.next()) {
                var _f = tslib_1.__read(_e.value, 2), rawIndex = _f[0], rawLocation = _f[1];
                rawLocations[rawIndex] = rawLocation.substring(0, 1).toUpperCase() + rawLocation.substring(1);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_2) throw e_2.error; }
        }
        try {
            for (var _g = tslib_1.__values(rawLocations.entries()), _h = _g.next(); !_h.done; _h = _g.next()) {
                var _j = tslib_1.__read(_h.value, 2), rawIndex = _j[0], rawLocation = _j[1];
                itemStat = 0;
                try {
                    for (var _k = (e_4 = void 0, tslib_1.__values(rawLocations.entries())), _l = _k.next(); !_l.done; _l = _k.next()) {
                        var _m = tslib_1.__read(_l.value, 2), otherIndex = _m[0], otherLocation = _m[1];
                        if (otherIndex === rawIndex)
                            continue;
                        if (rawLocation.indexOf(otherLocation) === 0)
                            itemStat += 1;
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                if (itemStat === 0)
                    result.push(rawLocation);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return result;
    };
    App.prototype.completeWsConnectionExcludes = function (rawExcludes, extensions, appRoot) {
        var e_5, _a, e_6, _b;
        var _this = this;
        var excludePaths = [], excludeRegExps = [], specReChars = '\\/.?!*+=^$|:#{}[]()<>';
        // client RegExps:
        rawExcludes.forEach(function (rawExclude) {
            var lastSlashPos, possibleRegExpSwitches = 'dgimsuy', regExpSwitches, regExpSwitchesCleaned, regExpContent;
            // check if RegExp begins with slash:
            if (rawExclude.substring(0, 1) !== '/')
                return excludePaths.push(rawExclude);
            // check if RegExp has another slash at the end and get it's index:
            lastSlashPos = rawExclude.substring(1).lastIndexOf('/');
            if (lastSlashPos === -1)
                return excludePaths.push(rawExclude);
            // check if there are only RegExp switches after last slash:
            regExpSwitches = rawExclude.substring(lastSlashPos + 2);
            regExpSwitchesCleaned = regExpSwitches;
            for (var i = 0, l = possibleRegExpSwitches.length; i < l; i += 1)
                regExpSwitchesCleaned = regExpSwitchesCleaned.replace(possibleRegExpSwitches.substring(i, 1), '');
            if (regExpSwitchesCleaned.length > 0)
                return excludePaths.push(rawExclude);
            // check if all other slashes are escaped:
            regExpContent = rawExclude.substring(1, lastSlashPos + 1);
            if (!_this.checkAllCharsBackSlashed(regExpContent, '/'))
                return excludePaths.push(rawExclude);
            // ok, it's RegExp:
            excludeRegExps.push(new RegExp(regExpContent, regExpSwitches));
        });
        try {
            // client paths to RegExps:
            for (var _c = tslib_1.__values(excludePaths.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var excludePath = _d.value;
                excludePath = excludePath.replace('/[\/]+/g', '/');
                if (excludePath.substring(0, 1) === '~')
                    excludePath = excludePath.replace('~', appRoot);
                try {
                    for (var specReChars_1 = (e_6 = void 0, tslib_1.__values(specReChars)), specReChars_1_1 = specReChars_1.next(); !specReChars_1_1.done; specReChars_1_1 = specReChars_1.next()) {
                        var specReChar = specReChars_1_1.value;
                        excludePath = excludePath.replace(new RegExp('\\' + specReChar, 'g'), '\\' + specReChar);
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (specReChars_1_1 && !specReChars_1_1.done && (_b = specReChars_1.return)) _b.call(specReChars_1);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
                excludeRegExps.push(new RegExp('^' + excludePath, 'g'));
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_5) throw e_5.error; }
        }
        excludeRegExps.push(new RegExp('\\.([-a-zA-Z0-9_\\$\\?\\!\\+\\=\\[\\]\\(\\)\\<\\>]+)(?<!' + extensions.join('|').toLowerCase() + ')$', 'gi'));
        return excludeRegExps;
    };
    App.prototype.startMonitoring = function (browserTabId) {
        var _this = this;
        var wsConnection = this.wsConnections.get(browserTabId);
        wsConnection.monitoring = true;
        wsConnection.fsWatchers = new Map();
        //console.log("start watching fs: " + browserTabId);
        return new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = [];
                        wsConnection.locations.forEach(function (location) {
                            promises.push(_this.startMonitoringLocation(wsConnection, location));
                        });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        //console.log("fs watching ready: " + browserTabId);
                        resolve();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    App.prototype.startMonitoringLocation = function (wsConnection, location) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var watcher = chokidar_1.default.watch(location, {
                ignored: wsConnection.excludeRegExps,
                ignoreInitial: true,
                persistent: true,
                disableGlobbing: true,
                usePolling: false,
                alwaysStat: false,
                followSymlinks: true,
                depth: 99,
                ignorePermissionErrors: false
            });
            wsConnection.fsWatchers.set(location, watcher);
            watcher.on('ready', function () {
                watcher.on('all', _this.handleFileSystemEvent.bind(_this, wsConnection.browserTabId));
                resolve();
            });
        });
    };
    App.prototype.stopMonitoring = function (wsConnection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var watcher, _a, _b, e_7_1;
            var e_7, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        //console.log("stop watching fs: " + wsConnection.browserTabId);
                        wsConnection.monitoring = false;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(wsConnection.fsWatchers.values()), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        watcher = _b.value;
                        return [4 /*yield*/, watcher.close()];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_7_1 = _d.sent();
                        e_7 = { error: e_7_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_7) throw e_7.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.handleFileSystemEvent = function (browserTabId, eventName, path) {
        //console.log(`Event: '${eventName}', path: '${path}'.`);
        var wsConnection = this.wsConnections.get(browserTabId);
        if (wsConnection.socket != null)
            wsConnection.socket.send(JSON.stringify({
                browserTabId: browserTabId,
                eventName: 'change',
                fsEventName: eventName,
                fsPath: path
            }));
    };
    App.prototype.handleWebSocketClose = function (browserTabId, code, reason) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var wsConnection;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                wsConnection = this.wsConnections.get(browserTabId);
                wsConnection.socket = null;
                clearTimeout(wsConnection.stopTimeoutId);
                wsConnection.stopTimeoutId = setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(wsConnection.socket == null)) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.stopMonitoring(wsConnection)];
                            case 1:
                                _a.sent();
                                this.removeWsConnection(wsConnection);
                                _a.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                }); }, this.static.MONITORING_LIFE_TIME);
                return [2 /*return*/];
            });
        });
    };
    App.prototype.handleWebSocketError = function (browserTabId, err) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var wsConnection;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsConnection = this.wsConnections.get(browserTabId);
                        return [4 /*yield*/, this.stopMonitoring(wsConnection)];
                    case 1:
                        _a.sent();
                        this.removeWsConnection(wsConnection);
                        return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.removeWsConnection = function (wsConnection) {
        if (wsConnection == null) {
            if (this.wsConnections.size === 0)
                return this.startServerEndInterval();
        }
        this.wsConnections.delete(wsConnection.browserTabId);
        if (this.wsConnections.size === 0)
            this.startServerEndInterval();
    };
    App.prototype.startServerEndInterval = function () {
        var _this = this;
        this.stopServerEndInterval();
        this.stopServerTimeoutId = setTimeout(function () {
            _this.wsServer.close(function () {
                _this.httpServer.Stop();
            });
        }, this.static.SERVER_LIFE_TIME);
    };
    App.prototype.stopServerEndInterval = function () {
        clearTimeout(this.stopServerTimeoutId);
    };
    App.prototype.checkAllCharsBackSlashed = function (content, char) {
        var lastPos = 0, newPos, contentLength = content.length, posBefore, escapedChar, allCharsEscaped = true;
        while (lastPos < contentLength) {
            newPos = content.indexOf(char, lastPos);
            if (newPos === -1)
                break;
            posBefore = newPos - 1;
            escapedChar = false;
            while (posBefore > lastPos) {
                if (content.substring(posBefore, posBefore + 1) !== '\\')
                    break;
                escapedChar = !escapedChar;
                posBefore -= 1;
            }
            if (!escapedChar) {
                allCharsEscaped = false;
                break;
            }
            lastPos = newPos + 1;
        }
        return allCharsEscaped;
    };
    App.prototype.getMonitoringPagesCount = function () {
        var e_8, _a;
        var count = 0;
        try {
            for (var _b = tslib_1.__values(this.wsConnections.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var wsConn = _c.value;
                if (wsConn.monitoring)
                    count++;
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return count;
    };
    App.SERVER_LIFE_TIME = 60000; // stop webserver after 60 seconds without any connection or any http request
    App.MONITORING_LIFE_TIME = 30000; // stop webserver after 30 seconds without any connection or any http request
    return App;
}());
var server = WebDevServer.Server.CreateNew();
var app = new App(server);
server
    .SetDocumentRoot(__dirname)
    .SetPort(parseInt(process.argv[2], 10))
    .SetHostname('127.0.0.1')
    .SetDevelopment(!false)
    .Start(function (success, err) {
    if (success) {
        (function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.Start()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }
});
