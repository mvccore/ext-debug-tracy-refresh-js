
class DebugRefreshPanel {
	public static readonly TRACY_COMMON_PANEL_ID_BASE: string = 'tracy-debug-panel-';
	public static readonly TRACY_REFRESH_PANEL_ID_BASE: string = 'tracy-refresh-panel-';
	public static readonly DATA_STORRAGE_KEY_END: string = 'refresh-data';
	public static readonly WS_ERR_STARTS_DELAY: number = 1000; // try to start next time after 1 second
	public static readonly WS_ERR_STARTS_CNT: number = 5; // try to start 5× times
	public static readonly CLS_PASSIVE: string = 'passive';
	public static readonly CLS_ACTIVE: string = 'active';
	public static readonly CLS_WAIT: string = 'wait';
	public static readonly BTN_TEXTS: string[] = ['Start monitoring file changes', 'Stop monitoring file changes'];
	public static readonly STATUS_TEXTS: string[] = ['Starting file changes monitoring...', 'Monitoring file changes...']
	protected static: typeof DebugRefreshPanel;
	protected static instance: DebugRefreshPanel;
	protected options: Options;
	protected tabElms: TabElements;
	protected formElms: FormElements;
	protected panelElmsInitEvent: boolean = false;
	protected panelElmsInitIntervalId: number;
	protected data: StorageData;
	protected socket: WebSocketWrapper;
	protected socketStartingTimeoutId: number;
	protected socketStartingCounter: number;
	protected socketReconnectsCnt: number = 0;
	protected activePagesCountText: string = 'unknown';
	public static GetInstance (options: Options): DebugRefreshPanel {
		if (this.instance == null)
			this.instance = new DebugRefreshPanel(options);
		return this.instance;
	}
	protected constructor (options: Options) {
		this.static = new.target;
		this.options = options;
		// Use setTimeout to start init method in next 
		// event loop (after event loop where all Tracy 
		// panels are rendered).
		if (document.readyState === 'complete') {
			setTimeout(async () => {
				await this.init();	
			});
		} else {
			document.addEventListener('readystatechange', (e) => {
				if (document.readyState === 'complete') {
					setTimeout(async () => {
						await this.init();	
					});
				}
			});
		}
	}
	protected async init (): Promise<void> {
		this
			.initData()
			.initElements()
			.initGlobalEvents();
		this.setIconEnabled(this.data.active);
		if (this.data.active) {
			this.setFormEnabled(false, true);
			this.setButtonToActiveState(false);
			if (this.formElms)
				this.formElms.form.className = this.static.CLS_WAIT;
			await this.startWsMonitoringWithStart();
		}
	}
	protected initData (): this {
		var rawData = window.sessionStorage.getItem(
				this.static.TRACY_REFRESH_PANEL_ID_BASE + this.static.DATA_STORRAGE_KEY_END
			),
			extensionsMap = new Map<string, boolean>();
		if (rawData == null) {
			for (var defaultExtensionsGroup of this.options.defaultExtensions) {
				for (var defaultExtension of defaultExtensionsGroup) {
					extensionsMap.set(defaultExtension, true);
				}
			}
			this.data = <StorageData>{
				active: false,
				browserTabId: this.getNewBrowserTabId(),
				locations: [].slice.apply(this.options.defaultLocations),
				excludes: [].slice.apply(this.options.defaultEcludePatterns),
				extensions: extensionsMap
			};
		} else {
			this.data = JSON.parse(rawData) as StorageData;
			for (var extensionName in this.data.extensions) {
				///@ts-ignore
				extensionsMap.set(extensionName, !!this.data.extensions[extensionName]);
			}
			this.data.extensions = extensionsMap;
		}
		return this;
	}
	protected initElements (): this {
		var tabContent = document.getElementById(
				this.static.TRACY_REFRESH_PANEL_ID_BASE + 'tab-' + this.options.panelUniqueId
			),
			panel = this.getPanelElement(),
			rawPanelData = window.localStorage.getItem(
				this.static.TRACY_COMMON_PANEL_ID_BASE + this.options.panelId
			);
		this.tabElms = <TabElements>{
			anchor: tabContent?.parentElement,
			icon: tabContent?.querySelector('svg circle'),
		}
		if (rawPanelData == null) {
			this.panelElmsInitEvent = true;
			return this;
		}
		if (panel != null) 
			return this.initFormElements(panel as HTMLDivElement);
		this.panelElmsInitIntervalId = window.setInterval(() => {
			panel = this.getPanelElement();
			if (panel != null) {
				clearInterval(this.panelElmsInitIntervalId);
				this.initFormElements(panel as HTMLDivElement);
			}
		}, 100);
		return this;
	}
	protected initFormElements (panel: HTMLDivElement): this {
		if (this.formElms != null) return this;
		var form = panel?.querySelector('form') as HTMLFormElement,
			formParent = panel?.parentElement as HTMLDivElement,
			locations = form.locations,
			excludes = form.excludes,
			extensionsList = form.extensions as RadioNodeList,
			extensionsMap = new Map<string, HTMLInputElement>(),
			start = form.start as HTMLButtonElement,
			statusText = form.querySelector('i.status'),
			activePagesCount = formParent.querySelector('h1 > span.right > span') as HTMLSpanElement;
		extensionsList.forEach(node => {
			var radioInput: HTMLInputElement = node as any;
			extensionsMap.set(radioInput.value, radioInput);
		});
		this.formElms = <FormElements>{
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
		locations.setAttribute(
			'rows', (this.data.locations.length + 1).toString()
		);
		excludes.value = this.data.excludes.join("\n");
		excludes.setAttribute(
			'rows', (this.data.excludes.length + 1).toString()
		);
		extensionsMap.forEach((extensionInput, extensionName) => {
			extensionInput.checked = !!this.data.extensions.get(extensionName);
		});
		return this.initFormEvents();
	}
	protected initFormEvents (): this {
		this.formElms.extensions.forEach((extensionInput, extensionName) => {
			extensionInput.addEventListener('change', (e: Event) => {
				this.data.extensions.set(extensionName, !!extensionInput.checked);
				this.writeData();
			});
		});
		this.formElms.locations.addEventListener('keyup', this.writeData.bind(this));
		this.formElms.excludes.addEventListener('keyup', this.writeData.bind(this));
		this.formElms.form.addEventListener('submit', this.handleFormSubmit.bind(this));
		return this;
	}
	protected initGlobalEvents (): this {
		if (this.panelElmsInitEvent) {
			this.tabElms.anchor.addEventListener(
				'mouseover', this.handleBarAnchorMouseOver.bind(this)
			);
		}
		window.addEventListener('unload', this.handlePageUnload.bind(this));
		return this;
	}
	protected handlePageUnload (e: Event): void {
		this.writeData();
		if (this.data.active) 
			this.processWsDisconnect(3000, 'Page unload.');
	}
	protected handleBarAnchorMouseOver (e: MouseEvent): void {
		this.tabElms.anchor.removeEventListener(
			'mouseover', this.handleBarAnchorMouseOver.bind(this)
		);
		if (this.panelElmsInitIntervalId != null)
			clearInterval(this.panelElmsInitIntervalId);
		this.panelElmsInitIntervalId = window.setInterval(() => {
			var panel = this.getPanelElement();
			if (panel != null) {
				clearInterval(this.panelElmsInitIntervalId);
				this.initFormElements(panel as HTMLDivElement);
			}
		});
	}
	protected handleFormSubmit (e: Event): void {
		e.preventDefault();
		if (this.formElms.form.className.indexOf(this.static.CLS_WAIT) > -1) return;
		var newActive = this.data.active = !this.data.active;
		this.writeData();
		this.setIconEnabled(newActive);
		this.setFormEnabled(!newActive, true);
		this.setButtonToActiveState(false);
		if (newActive) {
			this.setFormClassAndStatusText(this.static.CLS_WAIT, this.static.STATUS_TEXTS[0]);
			(async () => {
				await this.startWsMonitoringWithStart();
			})();
		} else if (this.socket != null) {
			this.setFormClassAndStatusText('', '');
			this.socket.Send(<WsMessageStop>{
				browserTabId: this.data.browserTabId,
				eventName: 'stop'
			});
		}
	}
	protected async startWsMonitoringWithStart (): Promise<void> {
		try {
			this.socket = await this.processWsConnect();
			this.initWsConnection();
		} catch (e) {
			var ajaxResult = await this.processStartRequest<AjaxResponse>();
			if (ajaxResult.success) {
				this.socketStartingCounter = 0;
				this.startWsMonitoringAfterStart();
			} else {
				console.error(ajaxResult.message);
			}
		}
	}
	protected startWsMonitoringAfterStart (): void {
		this.socketStartingTimeoutId = window.setTimeout(async () => {
			try {
				this.socket = await this.processWsConnect();
				window.clearTimeout(this.socketStartingTimeoutId);
				this.initWsConnection();
			} catch (e) {
				this.socketStartingCounter++;
				if (this.socketStartingCounter < this.static.WS_ERR_STARTS_CNT) {
					window.clearTimeout(this.socketStartingTimeoutId);
					this.startWsMonitoringAfterStart();
				} else {
					window.clearTimeout(this.socketStartingTimeoutId);
					console.error(e);
				}
			}
		}, this.static.WS_ERR_STARTS_DELAY);
	}
	protected async processWsConnect (): Promise<WebSocketWrapper> {
		return new Promise<WebSocketWrapper>((resolve, reject) => {
			var socket = new WebSocketWrapper(
				this.getWsUrl()
			);
			var error = (e: any) => {
				reject(e);
			};
			socket.Bind('open', () => {
				socket.Unbind('error', error);
				//console.log("ws connected");
				resolve(socket);
			});
			socket.Bind('error', error);
		});
	}
	protected processWsDisconnect (code: number, reason: string): void {
		this.socket.Close(code, reason);
	}
	protected initWsConnection (): void {
		var extensionsArr: string[] = [];
		this.data.extensions.forEach((value, key) => value && extensionsArr.push(key));
		this.socket.Send(<WsMessageStart>{
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
	}
	protected handleWsMonitoring (data: WsMessageMonitoring): void {
		this.setFormEnabled(false, false);
		this.setButtonToActiveState(true);
		this.activePagesCountText = String(data.monitoringPagesCount);
		if (this.formElms != null) {
			this.setUpFormElementsAfterStart(data);
		}
	}
	protected handleWsChange (data: WsMessageChange): void {
		//console.log(data);
		//return;
		window.removeEventListener('unload', this.handlePageUnload.bind(this));
		this.processWsDisconnect(3002, 'Server changes.');
		location.reload();
	}
	protected handleWsStopped (data: WsMessageStop): void {
		this.formElms.activePagesCount.innerHTML = String(data.monitoringPagesCount);
		this.processWsDisconnect(3001, 'Stop button.');
	}
	protected setUpFormElementsAfterStart (data: WsMessageMonitoring): void {
		this.formElms.start.removeAttribute('disabled');
		this.setFormClassAndStatusText('', this.static.STATUS_TEXTS[1]);
		this.formElms.activePagesCount.innerHTML = String(data.monitoringPagesCount);
		var newLineChar = this.getNewLineChar();
		this.formElms.locations.value = data.locations.join(newLineChar);
		this.formElms.excludes.value = data.excludes.join(newLineChar);
		this.formElms.extensions.forEach((extensionInput, extensionName) => {
			extensionInput.checked = data.extensions.indexOf(extensionName) !== -1;
		});
	}
	protected setFormClassAndStatusText (formClass: string, statusText: string): this {
		this.formElms.form.className = formClass;
		this.formElms.statusText.innerHTML = statusText;
		return this;
	}
	protected setIconEnabled (enabled: boolean): this {
		this.tabElms.icon.setAttribute(
			'class', enabled
				? this.static.CLS_ACTIVE
				: this.static.CLS_PASSIVE
		);
		return this;
	}
	protected setFormEnabled (enabled: boolean, includeBtn: boolean): this {
		if (!this.formElms) return this;
		var disabled = 'disabled',
			readonly = 'readonly',
			elms: [HTMLElement, boolean][] = [
				[this.formElms.locations, true],
				[this.formElms.excludes, true],
			];
		if (includeBtn)
			elms.push([this.formElms.start, false]);
		for (var checkbox of this.formElms.extensions.values())
			elms.push([checkbox, false]);
		
		if (enabled) {
			for (var [elm, textarea] of elms) {
				elm.removeAttribute(disabled);
				if (textarea)
					elm.removeAttribute(readonly);
			}
		} else {
			for (var [elm, textarea] of elms) {
				elm.setAttribute(disabled, disabled);
				elm.setAttribute(readonly, readonly);
			}
		}
		return this;
	}
	protected setButtonToActiveState (activeColor: boolean): this {
		if (!this.formElms) return this;
		var btn = this.formElms.start;
		btn.innerHTML = this.static.BTN_TEXTS[Number(activeColor)];
		btn.setAttribute(
			'class', activeColor
				? this.static.CLS_ACTIVE
				: this.static.CLS_PASSIVE
		);
		return this;
	}
	protected getWsUrl (): string {
		//var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
		var proto = 'ws:';
		return `${proto}//${this.options.address}:${this.options.port}/ws?browserTabId=${this.data.browserTabId}`;
	}
	protected getAjaxUrl (): string {
		return `?${this.options.startMonitoringParam}=1&XDEBUG_SESSION_STOP=1`;
	}
	protected writeData (): this {
		if (this.formElms == null) return this;
		this.data.locations = this.getTextAreaLines(this.formElms.locations);
		this.data.excludes = this.getTextAreaLines(this.formElms.excludes);
		var extensionsObj: any = {};
		for (var [extensionName, extensionBool] of this.data.extensions) {
			extensionsObj[extensionName] = extensionBool;
		}
		window.sessionStorage.setItem(
			this.static.TRACY_REFRESH_PANEL_ID_BASE + this.static.DATA_STORRAGE_KEY_END,
			JSON.stringify(<StorageData>{
				active: this.data.active,
				browserTabId: this.data.browserTabId,
				locations: this.data.locations,
				excludes: this.data.excludes,
				extensions: extensionsObj
			})
		);
		return this;
	}
	protected getPanelElement (): HTMLDivElement | null {
		return document.getElementById(
			this.static.TRACY_REFRESH_PANEL_ID_BASE + 'content-' + this.options.panelUniqueId
		) as HTMLDivElement;
	}
	protected getTextAreaLines (textArea: HTMLTextAreaElement): string[] {
		var rawStr = textArea.value.trim()
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n");
		return rawStr.split("\n").map(item => item.trim());
	}
	protected getNewBrowserTabId (): string {
		return String('browser-tab-id-' + Number(+new Date));
	}
	protected async processStartRequest <TResult>(): Promise<TResult> {
		return new Promise<TResult>((resolve, reject) => {
			var xhr = new window.XMLHttpRequest();
			xhr.open('POST', this.getAjaxUrl(), true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.addEventListener('error', (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
				reject({status: xhr.status, responseText: xhr.responseText});
			});
			xhr.addEventListener('load', (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
				var processed = false;
				if (xhr.status === 200) {
					var contentType = xhr.getResponseHeader('Content-Type');
					if (contentType === 'application/json') {
						try {
							resolve(JSON.parse(xhr.responseText) as TResult);
							processed = true;
						} catch (e) {
							reject(e);
						}
						if (processed) return;
					}
				}
				if (!processed)
					reject({status: xhr.status, responseText: xhr.responseText});
			});
			var extensionsObj: any = {};
			for (var [extensionName, extensionBool] of this.data.extensions) {
				extensionsObj[extensionName] = extensionBool;
			}
			xhr.send(JSON.stringify(<AjaxRequest>{
				locations: this.data.locations,
				excludes: this.data.excludes,
				extensions: extensionsObj
			}));
		});
	}
	protected getNewLineChar (): string {
		var os = navigator.platform.toLowerCase();
		if (os.indexOf('win') != -1) return "\r\n";
		if (os.indexOf('mac') != -1) return "\r";
		return "\n"; // linux
	}
};
type WsCallback = (data: any) => void;
class WebSocketWrapper {
	private _url:string;
	private _socket: WebSocket;
	private _opened: boolean = false;
	private _sendQueue: string[] = [];
	private _callbacks: Map<string, WsCallback[]> = new Map<string, WsCallback[]>();
	public constructor (url:string) {
		this._url = url;
		this._connect();
	}
	public Send (data: WsMessage): WebSocketWrapper {
		var str:string = JSON.stringify(data);
		//console.log(this._opened, str);
		if (this._opened) {
			this._socket.send(str);
		} else {
			this._sendQueue.push(str);
		};
		return this;
	}
	public Close (code: number = 3000, reason: string = 'transaction complete'): WebSocketWrapper {
		this._socket.close(code, reason);
		return this;
	}
	public Bind (eventName: string, callback: WsCallback): WebSocketWrapper {
		if (!this._callbacks.has(eventName)) 
			this._callbacks.set(eventName, []);
		var callbacks: WsCallback[] = this._callbacks.get(eventName) as WsCallback[], 
			cbMatched: boolean = false;
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
	}
	public Unbind (eventName: string, callback: WsCallback): WebSocketWrapper {
		if (!this._callbacks.has(eventName)) 
			this._callbacks.set(eventName, []);
		var callbacks: WsCallback[] = this._callbacks.get(eventName) as WsCallback[], 
			newCallbacks: WsCallback[] = [], 
			cb: WsCallback;
		for (var i = 0, l = callbacks.length; i < l; i++) {
			cb = callbacks[i];
			if (cb != callback)
				newCallbacks.push(cb);
		}
		this._callbacks.set(eventName, newCallbacks);
		if (newCallbacks.length == 0)
			this._callbacks.delete(eventName);
		return this;
	}
	private _connect (): boolean {
		var r:boolean = true;
		try {
			this._socket = new WebSocket(this._url);
			this._socket.addEventListener('error', this._onErrorHandler.bind(this));
			this._socket.addEventListener('close', this._onCloseHandler.bind(this));
			this._socket.addEventListener('open', this._onOpenHandler.bind(this));
			this._socket.addEventListener('message', this._onMessageHandler.bind(this));
		} catch (e) {
			r = false;
		}
		return r;
	}
	private _onOpenHandler (event: Event): void {
		var eventName:string = 'open';
		try {
			this._opened = true;
			if (this._callbacks.has(eventName))
				this._processCallbacks(this._callbacks.get(eventName) as WsCallback[], [event]);
			if (this._sendQueue.length) {
				for (var i:number = 0, l:number = this._sendQueue.length; i < l; i++)
					this._socket.send(this._sendQueue[i]);
				this._sendQueue = [];
			}
		} catch (e) {
			console.error(e);
		}
	}
	private _onErrorHandler (event: Event): void {
		var eventName: string = 'error';
		this._opened = false;
		if (this._callbacks.has(eventName))
			this._processCallbacks(this._callbacks.get(eventName) as WsCallback[], [event]);
	}
	private _onCloseHandler (event: CloseEvent): void {
		var eventName: string = 'close';
		this._opened = false;
		if (this._callbacks.has(eventName))
			this._processCallbacks(this._callbacks.get(eventName) as WsCallback[], [event]);
	}
	private _onMessageHandler (event: MessageEvent): void {
		var eventName: string = '',
			data: WsMessage | null = null;
		try {
			data = JSON.parse(event.data) as WsMessage;
			eventName = data.eventName;
		} catch (e) {
			console.error(e);
		}
		if (eventName.length == 0) {
			console.error(
				'Server data has to be JS object formated like: '+
				'`{"eventName":"myEvent","data":{"any":"data","as":"object"}}`'
			);
		} else if (this._callbacks.has(eventName)) {
			this._processCallbacks(this._callbacks.get(eventName) as WsCallback[], [data]);
		} else {
			console.error(
				"No callback found for socket event: `" 
				+ eventName + "`, url: `" 
				+ this._url + "`, data: `" 
				+ String(event.data) + "`."
			);
		}
	}
	private _processCallbacks (callbacks: WsCallback[], args: any[]): void {
		var cb: Function;
		for (var i: number = 0, l: number = callbacks.length; i < l; i++) {
			cb = callbacks[i];
			cb.apply(null, args);
		}
	}
}