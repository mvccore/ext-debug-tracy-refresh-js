var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
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
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var DebugRefreshPanel = /** @class */ (function () {
    function DebugRefreshPanel(options) {
        var _newTarget = this.constructor;
        var _this = this;
        this.panelElmsInitEvent = false;
        this.socketReconnectsCnt = 0;
        this.activePagesCountText = 'unknown';
        this.static = _newTarget;
        this.options = options;
        // Use setTimeout to start init method in next 
        // event loop (after event loop where all Tracy 
        // panels are rendered).
        if (document.readyState === 'complete') {
            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        }
        else {
            document.addEventListener('readystatechange', function (e) {
                if (document.readyState === 'complete') {
                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.init()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                }
            });
        }
    }
    DebugRefreshPanel.GetInstance = function (options) {
        if (this.instance == null)
            this.instance = new DebugRefreshPanel(options);
        return this.instance;
    };
    DebugRefreshPanel.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this
                            .initData()
                            .initElements()
                            .initGlobalEvents();
                        this.setIconEnabled(this.data.active);
                        if (!this.data.active) return [3 /*break*/, 2];
                        this.setFormEnabled(false, true);
                        this.setButtonToActiveState(false);
                        if (this.formElms)
                            this.formElms.form.className = this.static.CLS_WAIT;
                        return [4 /*yield*/, this.startWsMonitoringWithStart()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    DebugRefreshPanel.prototype.initData = function () {
        var e_1, _a, e_2, _b;
        var rawData = window.sessionStorage.getItem(this.static.TRACY_REFRESH_PANEL_ID_BASE + this.static.DATA_STORRAGE_KEY_END), extensionsMap = new Map();
        if (rawData == null) {
            try {
                for (var _c = __values(this.options.defaultExtensions), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var defaultExtensionsGroup = _d.value;
                    try {
                        for (var defaultExtensionsGroup_1 = (e_2 = void 0, __values(defaultExtensionsGroup)), defaultExtensionsGroup_1_1 = defaultExtensionsGroup_1.next(); !defaultExtensionsGroup_1_1.done; defaultExtensionsGroup_1_1 = defaultExtensionsGroup_1.next()) {
                            var defaultExtension = defaultExtensionsGroup_1_1.value;
                            extensionsMap.set(defaultExtension, true);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (defaultExtensionsGroup_1_1 && !defaultExtensionsGroup_1_1.done && (_b = defaultExtensionsGroup_1.return)) _b.call(defaultExtensionsGroup_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.data = {
                active: false,
                browserTabId: this.getNewBrowserTabId(),
                locations: [].slice.apply(this.options.defaultLocations),
                excludes: [].slice.apply(this.options.defaultEcludePatterns),
                extensions: extensionsMap
            };
        }
        else {
            this.data = JSON.parse(rawData);
            for (var extensionName in this.data.extensions) {
                ///@ts-ignore
                extensionsMap.set(extensionName, !!this.data.extensions[extensionName]);
            }
            this.data.extensions = extensionsMap;
        }
        return this;
    };
    DebugRefreshPanel.prototype.initElements = function () {
        var _this = this;
        var tabContent = document.getElementById(this.static.TRACY_REFRESH_PANEL_ID_BASE + 'tab-' + this.options.panelUniqueId), panel = this.getPanelElement(), rawPanelData = window.localStorage.getItem(this.static.TRACY_COMMON_PANEL_ID_BASE + this.options.panelId);
        this.tabElms = {
            anchor: tabContent === null || tabContent === void 0 ? void 0 : tabContent.parentElement,
            icon: tabContent === null || tabContent === void 0 ? void 0 : tabContent.querySelector('svg circle'),
        };
        if (rawPanelData == null) {
            this.panelElmsInitEvent = true;
            return this;
        }
        if (panel != null)
            return this.initFormElements(panel);
        this.panelElmsInitIntervalId = window.setInterval(function () {
            panel = _this.getPanelElement();
            if (panel != null) {
                clearInterval(_this.panelElmsInitIntervalId);
                _this.initFormElements(panel);
            }
        }, 100);
        return this;
    };
    DebugRefreshPanel.prototype.initFormElements = function (panel) {
        var _this = this;
        if (this.formElms != null)
            return this;
        var form = panel === null || panel === void 0 ? void 0 : panel.querySelector('form'), formParent = panel === null || panel === void 0 ? void 0 : panel.parentElement, locations = form.locations, excludes = form.excludes, extensionsList = form.extensions, extensionsMap = new Map(), start = form.start, statusText = form.querySelector('i.status'), activePagesCount = formParent.querySelector('h1 > span.right > span');
        extensionsList.forEach(function (node) {
            var radioInput = node;
            extensionsMap.set(radioInput.value, radioInput);
        });
        this.formElms = {
            form: form,
            locations: locations,
            excludes: excludes,
            extensions: extensionsMap,
            start: start,
            statusText: statusText,
            activePagesCount: activePagesCount
        };
        activePagesCount.innerHTML = this.activePagesCountText;
        this.setFormEnabled(!this.data.active, false);
        this.setButtonToActiveState(this.data.active);
        locations.value = this.data.locations.join("\n");
        locations.setAttribute('rows', (this.data.locations.length + 1).toString());
        excludes.value = this.data.excludes.join("\n");
        excludes.setAttribute('rows', (this.data.excludes.length + 1).toString());
        extensionsMap.forEach(function (extensionInput, extensionName) {
            extensionInput.checked = !!_this.data.extensions.get(extensionName);
        });
        return this.initFormEvents();
    };
    DebugRefreshPanel.prototype.initFormEvents = function () {
        var _this = this;
        this.formElms.extensions.forEach(function (extensionInput, extensionName) {
            extensionInput.addEventListener('change', function (e) {
                _this.data.extensions.set(extensionName, !!extensionInput.checked);
                _this.writeData();
            });
        });
        this.formElms.locations.addEventListener('keyup', this.writeData.bind(this));
        this.formElms.excludes.addEventListener('keyup', this.writeData.bind(this));
        this.formElms.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        return this;
    };
    DebugRefreshPanel.prototype.initGlobalEvents = function () {
        if (this.panelElmsInitEvent) {
            this.tabElms.anchor.addEventListener('mouseover', this.handleBarAnchorMouseOver.bind(this));
        }
        window.addEventListener('unload', this.handlePageUnload.bind(this));
        return this;
    };
    DebugRefreshPanel.prototype.handlePageUnload = function (e) {
        this.writeData();
        if (this.data.active)
            this.processWsDisconnect(3000, 'Page unload.');
    };
    DebugRefreshPanel.prototype.handleBarAnchorMouseOver = function (e) {
        var _this = this;
        this.tabElms.anchor.removeEventListener('mouseover', this.handleBarAnchorMouseOver.bind(this));
        if (this.panelElmsInitIntervalId != null)
            clearInterval(this.panelElmsInitIntervalId);
        this.panelElmsInitIntervalId = window.setInterval(function () {
            var panel = _this.getPanelElement();
            if (panel != null) {
                clearInterval(_this.panelElmsInitIntervalId);
                _this.initFormElements(panel);
            }
        });
    };
    DebugRefreshPanel.prototype.handleFormSubmit = function (e) {
        var _this = this;
        e.preventDefault();
        if (this.formElms.form.className.indexOf(this.static.CLS_WAIT) > -1)
            return;
        var newActive = this.data.active = !this.data.active;
        this.writeData();
        this.setIconEnabled(newActive);
        this.setFormEnabled(!newActive, true);
        this.setButtonToActiveState(false);
        if (newActive) {
            this.setFormClassAndStatusText(this.static.CLS_WAIT, this.static.STATUS_TEXTS[0]);
            (function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.startWsMonitoringWithStart()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); })();
        }
        else if (this.socket != null) {
            this.setFormClassAndStatusText('', '');
            this.socket.Send({
                browserTabId: this.data.browserTabId,
                eventName: 'stop'
            });
        }
    };
    DebugRefreshPanel.prototype.startWsMonitoringWithStart = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, e_3, ajaxResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 4]);
                        _a = this;
                        return [4 /*yield*/, this.processWsConnect()];
                    case 1:
                        _a.socket = _b.sent();
                        this.initWsConnection();
                        return [3 /*break*/, 4];
                    case 2:
                        e_3 = _b.sent();
                        return [4 /*yield*/, this.processStartRequest()];
                    case 3:
                        ajaxResult = _b.sent();
                        if (ajaxResult.success) {
                            this.socketStartingCounter = 0;
                            this.startWsMonitoringAfterStart();
                        }
                        else {
                            console.error(ajaxResult.message);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DebugRefreshPanel.prototype.startWsMonitoringAfterStart = function () {
        var _this = this;
        this.socketStartingTimeoutId = window.setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = this;
                        return [4 /*yield*/, this.processWsConnect()];
                    case 1:
                        _a.socket = _b.sent();
                        window.clearTimeout(this.socketStartingTimeoutId);
                        this.initWsConnection();
                        return [3 /*break*/, 3];
                    case 2:
                        e_4 = _b.sent();
                        this.socketStartingCounter++;
                        if (this.socketStartingCounter < this.static.WS_ERR_STARTS_CNT) {
                            window.clearTimeout(this.socketStartingTimeoutId);
                            this.startWsMonitoringAfterStart();
                        }
                        else {
                            window.clearTimeout(this.socketStartingTimeoutId);
                            console.error(e_4);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, this.static.WS_ERR_STARTS_DELAY);
    };
    DebugRefreshPanel.prototype.processWsConnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var socket = new WebSocketWrapper(_this.getWsUrl());
                        var error = function (e) {
                            reject(e);
                        };
                        socket.Bind('open', function () {
                            socket.Unbind('error', error);
                            //console.log("ws connected");
                            resolve(socket);
                        });
                        socket.Bind('error', error);
                    })];
            });
        });
    };
    DebugRefreshPanel.prototype.processWsDisconnect = function (code, reason) {
        this.socket.Close(code, reason);
    };
    DebugRefreshPanel.prototype.initWsConnection = function () {
        var extensionsArr = [];
        this.data.extensions.forEach(function (value, key) { return value && extensionsArr.push(key); });
        this.socket.Send({
            eventName: 'start',
            browserTabId: this.data.browserTabId,
            appRoot: this.options.appRoot,
            locations: this.data.locations,
            excludes: this.data.excludes,
            extensions: extensionsArr
        });
        this.socket.Bind('monitoring', this.handleWsMonitoring.bind(this));
        this.socket.Bind('change', this.handleWsChange.bind(this));
        this.socket.Bind('stopped', this.handleWsStopped.bind(this));
    };
    DebugRefreshPanel.prototype.handleWsMonitoring = function (data) {
        this.setFormEnabled(false, false);
        this.setButtonToActiveState(true);
        this.activePagesCountText = String(data.monitoringPagesCount);
        if (this.formElms != null) {
            this.setUpFormElementsAfterStart(data);
        }
    };
    DebugRefreshPanel.prototype.handleWsChange = function (data) {
        //console.log(data);
        //return;
        window.removeEventListener('unload', this.handlePageUnload.bind(this));
        this.processWsDisconnect(3002, 'Server changes.');
        location.reload();
    };
    DebugRefreshPanel.prototype.handleWsStopped = function (data) {
        this.formElms.activePagesCount.innerHTML = String(data.monitoringPagesCount);
        this.processWsDisconnect(3001, 'Stop button.');
    };
    DebugRefreshPanel.prototype.setUpFormElementsAfterStart = function (data) {
        this.formElms.start.removeAttribute('disabled');
        this.setFormClassAndStatusText('', this.static.STATUS_TEXTS[1]);
        this.formElms.activePagesCount.innerHTML = String(data.monitoringPagesCount);
        var newLineChar = this.getNewLineChar();
        this.formElms.locations.value = data.locations.join(newLineChar);
        this.formElms.excludes.value = data.excludes.join(newLineChar);
        this.formElms.extensions.forEach(function (extensionInput, extensionName) {
            extensionInput.checked = data.extensions.indexOf(extensionName) !== -1;
        });
    };
    DebugRefreshPanel.prototype.setFormClassAndStatusText = function (formClass, statusText) {
        this.formElms.form.className = formClass;
        this.formElms.statusText.innerHTML = statusText;
        return this;
    };
    DebugRefreshPanel.prototype.setIconEnabled = function (enabled) {
        this.tabElms.icon.setAttribute('class', enabled
            ? this.static.CLS_ACTIVE
            : this.static.CLS_PASSIVE);
        return this;
    };
    DebugRefreshPanel.prototype.setFormEnabled = function (enabled, includeBtn) {
        var e_5, _a, e_6, _b, e_7, _c;
        if (!this.formElms)
            return this;
        var disabled = 'disabled', readonly = 'readonly', elms = [
            [this.formElms.locations, true],
            [this.formElms.excludes, true],
        ];
        if (includeBtn)
            elms.push([this.formElms.start, false]);
        try {
            for (var _d = __values(this.formElms.extensions.values()), _e = _d.next(); !_e.done; _e = _d.next()) {
                var checkbox = _e.value;
                elms.push([checkbox, false]);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_5) throw e_5.error; }
        }
        if (enabled) {
            try {
                for (var elms_1 = __values(elms), elms_1_1 = elms_1.next(); !elms_1_1.done; elms_1_1 = elms_1.next()) {
                    var _f = __read(elms_1_1.value, 2), elm = _f[0], textarea = _f[1];
                    elm.removeAttribute(disabled);
                    if (textarea)
                        elm.removeAttribute(readonly);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (elms_1_1 && !elms_1_1.done && (_b = elms_1.return)) _b.call(elms_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        else {
            try {
                for (var elms_2 = __values(elms), elms_2_1 = elms_2.next(); !elms_2_1.done; elms_2_1 = elms_2.next()) {
                    var _g = __read(elms_2_1.value, 2), elm = _g[0], textarea = _g[1];
                    elm.setAttribute(disabled, disabled);
                    elm.setAttribute(readonly, readonly);
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (elms_2_1 && !elms_2_1.done && (_c = elms_2.return)) _c.call(elms_2);
                }
                finally { if (e_7) throw e_7.error; }
            }
        }
        return this;
    };
    DebugRefreshPanel.prototype.setButtonToActiveState = function (activeColor) {
        if (!this.formElms)
            return this;
        var btn = this.formElms.start;
        btn.innerHTML = this.static.BTN_TEXTS[Number(activeColor)];
        btn.setAttribute('class', activeColor
            ? this.static.CLS_ACTIVE
            : this.static.CLS_PASSIVE);
        return this;
    };
    DebugRefreshPanel.prototype.getWsUrl = function () {
        var proto = location.protocol === 'https:' ? 'wss:' : 'ws:', port = this.options.port, portStr = (port === 80 || port === 443) ? '' : ':' + port;
        return "".concat(proto, "//").concat(this.options.address).concat(portStr, "/ws?browserTabId=").concat(this.data.browserTabId);
    };
    DebugRefreshPanel.prototype.getAjaxUrl = function () {
        return "?".concat(this.options.startMonitoringParam, "=1&XDEBUG_SESSION_STOP=1");
    };
    DebugRefreshPanel.prototype.writeData = function () {
        var e_8, _a;
        if (this.formElms == null)
            return this;
        this.data.locations = this.getTextAreaLines(this.formElms.locations);
        this.data.excludes = this.getTextAreaLines(this.formElms.excludes);
        var extensionsObj = {};
        try {
            for (var _b = __values(this.data.extensions), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), extensionName = _d[0], extensionBool = _d[1];
                extensionsObj[extensionName] = extensionBool;
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
        window.sessionStorage.setItem(this.static.TRACY_REFRESH_PANEL_ID_BASE + this.static.DATA_STORRAGE_KEY_END, JSON.stringify({
            active: this.data.active,
            browserTabId: this.data.browserTabId,
            locations: this.data.locations,
            excludes: this.data.excludes,
            extensions: extensionsObj
        }));
        return this;
    };
    DebugRefreshPanel.prototype.getPanelElement = function () {
        return document.getElementById(this.static.TRACY_REFRESH_PANEL_ID_BASE + 'content-' + this.options.panelUniqueId);
    };
    DebugRefreshPanel.prototype.getTextAreaLines = function (textArea) {
        var rawStr = textArea.value.trim()
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");
        return rawStr.split("\n").map(function (item) { return item.trim(); });
    };
    DebugRefreshPanel.prototype.getNewBrowserTabId = function () {
        return String('browser-tab-id-' + Number(+new Date));
    };
    DebugRefreshPanel.prototype.processStartRequest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var e_9, _a;
                        var xhr = new window.XMLHttpRequest();
                        xhr.open('POST', _this.getAjaxUrl(), true);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.addEventListener('error', function (e) {
                            reject({ status: xhr.status, responseText: xhr.responseText });
                        });
                        xhr.addEventListener('load', function (e) {
                            var processed = false;
                            if (xhr.status === 200) {
                                var contentType = xhr.getResponseHeader('Content-Type');
                                if (contentType === 'application/json') {
                                    try {
                                        resolve(JSON.parse(xhr.responseText));
                                        processed = true;
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                    if (processed)
                                        return;
                                }
                            }
                            if (!processed)
                                reject({ status: xhr.status, responseText: xhr.responseText });
                        });
                        var extensionsObj = {};
                        try {
                            for (var _b = __values(_this.data.extensions), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var _d = __read(_c.value, 2), extensionName = _d[0], extensionBool = _d[1];
                                extensionsObj[extensionName] = extensionBool;
                            }
                        }
                        catch (e_9_1) { e_9 = { error: e_9_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_9) throw e_9.error; }
                        }
                        xhr.send(JSON.stringify({
                            locations: _this.data.locations,
                            excludes: _this.data.excludes,
                            extensions: extensionsObj
                        }));
                    })];
            });
        });
    };
    DebugRefreshPanel.prototype.getNewLineChar = function () {
        var os = navigator.platform.toLowerCase();
        if (os.indexOf('win') != -1)
            return "\r\n";
        if (os.indexOf('mac') != -1)
            return "\r";
        return "\n"; // linux
    };
    DebugRefreshPanel.TRACY_COMMON_PANEL_ID_BASE = 'tracy-debug-panel-';
    DebugRefreshPanel.TRACY_REFRESH_PANEL_ID_BASE = 'tracy-refresh-panel-';
    DebugRefreshPanel.DATA_STORRAGE_KEY_END = 'refresh-data';
    DebugRefreshPanel.WS_ERR_STARTS_DELAY = 1000; // try to start next time after 1 second
    DebugRefreshPanel.WS_ERR_STARTS_CNT = 5; // try to start 5× times
    DebugRefreshPanel.CLS_PASSIVE = 'passive';
    DebugRefreshPanel.CLS_ACTIVE = 'active';
    DebugRefreshPanel.CLS_WAIT = 'wait';
    DebugRefreshPanel.BTN_TEXTS = ['Start monitoring file changes', 'Stop monitoring file changes'];
    DebugRefreshPanel.STATUS_TEXTS = ['Starting file changes monitoring...', 'Monitoring file changes...'];
    return DebugRefreshPanel;
}());
;
var WebSocketWrapper = /** @class */ (function () {
    function WebSocketWrapper(url) {
        this._opened = false;
        this._sendQueue = [];
        this._callbacks = new Map();
        this._url = url;
        this._connect();
    }
    WebSocketWrapper.prototype.Send = function (data) {
        var str = JSON.stringify(data);
        //console.log(this._opened, str);
        if (this._opened) {
            this._socket.send(str);
        }
        else {
            this._sendQueue.push(str);
        }
        ;
        return this;
    };
    WebSocketWrapper.prototype.Close = function (code, reason) {
        if (code === void 0) { code = 3000; }
        if (reason === void 0) { reason = 'transaction complete'; }
        this._socket.close(code, reason);
        return this;
    };
    WebSocketWrapper.prototype.Bind = function (eventName, callback) {
        if (!this._callbacks.has(eventName))
            this._callbacks.set(eventName, []);
        var callbacks = this._callbacks.get(eventName), cbMatched = false;
        for (var i = 0, l = callbacks.length; i < l; i++) {
            if (callbacks[i] === callback) {
                cbMatched = true;
                break;
            }
        }
        if (!cbMatched) {
            callbacks.push(callback);
            this._callbacks.set(eventName, callbacks);
        }
        return this;
    };
    WebSocketWrapper.prototype.Unbind = function (eventName, callback) {
        if (!this._callbacks.has(eventName))
            this._callbacks.set(eventName, []);
        var callbacks = this._callbacks.get(eventName), newCallbacks = [], cb;
        for (var i = 0, l = callbacks.length; i < l; i++) {
            cb = callbacks[i];
            if (cb != callback)
                newCallbacks.push(cb);
        }
        this._callbacks.set(eventName, newCallbacks);
        if (newCallbacks.length == 0)
            this._callbacks.delete(eventName);
        return this;
    };
    WebSocketWrapper.prototype._connect = function () {
        var r = true;
        try {
            this._socket = new WebSocket(this._url);
            this._socket.addEventListener('error', this._onErrorHandler.bind(this));
            this._socket.addEventListener('close', this._onCloseHandler.bind(this));
            this._socket.addEventListener('open', this._onOpenHandler.bind(this));
            this._socket.addEventListener('message', this._onMessageHandler.bind(this));
        }
        catch (e) {
            r = false;
        }
        return r;
    };
    WebSocketWrapper.prototype._onOpenHandler = function (event) {
        var eventName = 'open';
        try {
            this._opened = true;
            if (this._callbacks.has(eventName))
                this._processCallbacks(this._callbacks.get(eventName), [event]);
            if (this._sendQueue.length) {
                for (var i = 0, l = this._sendQueue.length; i < l; i++)
                    this._socket.send(this._sendQueue[i]);
                this._sendQueue = [];
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    WebSocketWrapper.prototype._onErrorHandler = function (event) {
        var eventName = 'error';
        this._opened = false;
        if (this._callbacks.has(eventName))
            this._processCallbacks(this._callbacks.get(eventName), [event]);
    };
    WebSocketWrapper.prototype._onCloseHandler = function (event) {
        var eventName = 'close';
        this._opened = false;
        if (this._callbacks.has(eventName))
            this._processCallbacks(this._callbacks.get(eventName), [event]);
    };
    WebSocketWrapper.prototype._onMessageHandler = function (event) {
        var eventName = '', data = null;
        try {
            data = JSON.parse(event.data);
            eventName = data.eventName;
        }
        catch (e) {
            console.error(e);
        }
        if (eventName.length == 0) {
            console.error('Server data has to be JS object formated like: ' +
                '`{"eventName":"myEvent","data":{"any":"data","as":"object"}}`');
        }
        else if (this._callbacks.has(eventName)) {
            this._processCallbacks(this._callbacks.get(eventName), [data]);
        }
        else {
            console.error("No callback found for socket event: `"
                + eventName + "`, url: `"
                + this._url + "`, data: `"
                + String(event.data) + "`.");
        }
    };
    WebSocketWrapper.prototype._processCallbacks = function (callbacks, args) {
        var cb;
        for (var i = 0, l = callbacks.length; i < l; i++) {
            cb = callbacks[i];
            cb.apply(null, args);
        }
    };
    return WebSocketWrapper;
}());
