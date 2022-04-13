import chokidar from 'chokidar';
import * as WebDevServer from "web-dev-server";
import WebSocket from "ws";
class App {
	public static readonly SERVER_LIFE_TIME: number = 60000; // stop webserver after 60 seconds without any connection or any http request
	public static readonly MONITORING_LIFE_TIME: number = 30000; // stop webserver after 30 seconds without any connection or any http request
	protected static: typeof App;
	protected httpServer: WebDevServer.Server;
	protected wsServer: WebSocket.Server<WebSocket.WebSocket>;
	protected wsConnections: Map<string, WsConnection>;
	protected stopServerTimeoutId: NodeJS.Timeout;
	public constructor (server: WebDevServer.Server) {
		this.static = new.target;
		this.httpServer = server;
		this.wsConnections = new Map<string, WsConnection>();
	}
	public async Start (): Promise<void> {
		this.wsServer = new WebSocket.Server<WebSocket.WebSocket>(<WebSocket.ServerOptions>{
			server: this.httpServer.GetHttpServer()
		});
		this.wsServer.on('connection', await this.handleWebSocketConnection.bind(this));
		this.startServerEndInterval();
	}
	protected async handleWebSocketConnection (socket: WebSocket.WebSocket, request: WebDevServer.Request): Promise<void> {
		this.stopServerEndInterval();
		var browserTabId = request.GetParam('browserTabId', '-a-z0-9');
		if (this.wsConnections.has(browserTabId)) {
			var prevWsConnection = this.wsConnections.get(browserTabId) as WsConnection;
			clearTimeout(prevWsConnection.stopTimeoutId);
			prevWsConnection.socket = socket;
		} else {
			this.wsConnections.set(browserTabId, <WsConnection>{
				browserTabId: browserTabId,
				monitoring: false,
				socket: socket
			});
		}
		socket.on('message', async (rawData: WebSocket.RawData, isBinary: boolean): Promise<void> => {
			try {
				await this.handleWebSocketMessage(rawData, socket);
			} catch (e) {
				console.error(e);
			}
		});
		socket.on('close', this.handleWebSocketClose.bind(this, browserTabId));
		socket.on('error', this.handleWebSocketError.bind(this, browserTabId));
	}
	protected async handleWebSocketMessage (rawData: WebSocket.RawData, socket: WebSocket.WebSocket): Promise<void> {
		var sentData = JSON.parse(rawData.toString()) as WsMessage,
			eventName = sentData.eventName;
		if (!this.wsConnections.has(sentData.browserTabId))
			return;// console.log('Unknown browser tab id.');
		if (eventName === 'start') {
			await this.handleWebSocketMessageStart(sentData as WsMessageStart);
		} else if (eventName === 'stop') {
			await this.handleWebSocketMessageStop(sentData as WsMessageStop);
		} else {
			//console.log('Unknown WebSocket event name.');
		}
	}
	protected async handleWebSocketMessageStart (data: WsMessageStart): Promise<void> {
		var wsConnection = this.wsConnections.get(data.browserTabId) as WsConnection;
		if (!wsConnection.monitoring)
			wsConnection = this.setUpWsConnectionData(data);
		if (wsConnection.monitoring) {
			this.sendMonitoringStarted(data);
		} else {
			await this.startMonitoring(data.browserTabId);
			this.sendMonitoringStarted(data);
		}
	}
	protected sendMonitoringStarted (data: WsMessageStart): void {
		var wsConnection = this.wsConnections.get(data.browserTabId) as WsConnection;
		wsConnection.socket.send(JSON.stringify(<WsMessageMonitoring>{
			browserTabId: wsConnection.browserTabId,
			eventName: 'monitoring',
			monitoringPagesCount: this.getMonitoringPagesCount(),
			locations: wsConnection.locations,
			excludes: data.excludes,
			extensions: data.extensions
		}));
	}
	protected async handleWebSocketMessageStop (data: WsMessageStop): Promise<void> {
		var wsConnection = this.wsConnections.get(data.browserTabId) as WsConnection;
		await this.stopMonitoring(wsConnection);
		wsConnection.socket.send(JSON.stringify(<WsMessage>{
			browserTabId: data.browserTabId,
			eventName: 'stopped',
			monitoringPagesCount: this.getMonitoringPagesCount()
		}));
	}
	protected setUpWsConnectionData (data: WsMessageStart): WsConnection {
		var wsConnection = this.wsConnections.get(data.browserTabId) as WsConnection;
		wsConnection.appRoot = data.appRoot;
		wsConnection.locations = this.completeWsConnectionLocations(data.locations);
		wsConnection.excludeRegExps = this.completeWsConnectionExcludes(data.excludes, data.extensions, data.appRoot);
		return wsConnection;
	}
	protected completeWsConnectionLocations (rawLocations: string[]): string[] {
		var result: string[] = [],
			itemStat: number;
		for (var [rawIndex, rawLocation] of rawLocations.entries()) 
			rawLocations[rawIndex] = rawLocation.substring(0, 1).toUpperCase() + rawLocation.substring(1);
		for (var [rawIndex, rawLocation] of rawLocations.entries()) {
			itemStat = 0;
			for (var [otherIndex, otherLocation] of rawLocations.entries()) {
				if (otherIndex === rawIndex) continue;
				if (rawLocation.indexOf(otherLocation) === 0) 
					itemStat += 1;
			}
			if (itemStat === 0)
				result.push(rawLocation);
		}
		return result;
	}
	protected completeWsConnectionExcludes (rawExcludes: string[], extensions: string[], appRoot: string): RegExp[] {
		var excludePaths: string[] = [], 
			excludeRegExps: RegExp[] = [],
			specReChars = '\\/.?!*+=^$|:#{}[]()<>';
		// client RegExps:
		rawExcludes.forEach((rawExclude): any => {
			var lastSlashPos: number,
				possibleRegExpSwitches = 'dgimsuy',
				regExpSwitches: string,
				regExpSwitchesCleaned: string,
				regExpContent: string;
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
				regExpSwitchesCleaned = regExpSwitchesCleaned.replace(
					possibleRegExpSwitches.substring(i, 1), ''
				);
			if (regExpSwitchesCleaned.length > 0)
				return excludePaths.push(rawExclude);
			// check if all other slashes are escaped:
			regExpContent = rawExclude.substring(1, lastSlashPos + 1);
			if (!this.checkAllCharsBackSlashed(regExpContent, '/')) 
				return excludePaths.push(rawExclude);
			// ok, it's RegExp:
			excludeRegExps.push(new RegExp(regExpContent, regExpSwitches));
		});
		// client paths to RegExps:
		for (var excludePath of excludePaths.values()) {
			excludePath = excludePath.replace('/[\/]+/g', '/');
			if (excludePath.substring(0, 1) === '~') 
				excludePath = excludePath.replace('~', appRoot);
			for (var specReChar of specReChars) 
				excludePath = excludePath.replace(new RegExp('\\' + specReChar, 'g'), '\\' + specReChar);
			excludeRegExps.push(new RegExp(
				'^' + excludePath, 'g'
			));
		}
		excludeRegExps.push(new RegExp(			
			'\\.([-a-zA-Z0-9_\\$\\?\\!\\+\\=\\[\\]\\(\\)\\<\\>]+)(?<!' + extensions.join('|').toLowerCase() + ')$',
			'gi'
		));
		return excludeRegExps;
	}
	protected startMonitoring (browserTabId: string): Promise<void> {
		var wsConnection = this.wsConnections.get(browserTabId) as WsConnection;
		wsConnection.monitoring = true;
		wsConnection.fsWatchers = new Map<string, chokidar.FSWatcher>();
		//console.log("start watching fs: " + browserTabId);
		return new Promise<void>(async (resolve, reject) => {
			var promises: Promise<void>[] = [];
			wsConnection.locations.forEach(location => {
				promises.push(this.startMonitoringLocation(wsConnection, location));
			});
			await Promise.all(promises);
			//console.log("fs watching ready: " + browserTabId);
			resolve();
		});
	}
	protected startMonitoringLocation (wsConnection: WsConnection, location: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			var watcher = chokidar.watch(location, <chokidar.WatchOptions>{
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
			watcher.on('ready', () => {
				watcher.on('all', this.handleFileSystemEvent.bind(this, wsConnection.browserTabId));
				resolve();
			});
		});
	}
	protected async stopMonitoring (wsConnection: WsConnection): Promise<void> {
		//console.log("stop watching fs: " + wsConnection.browserTabId);
		wsConnection.monitoring = false;
		var watcher: chokidar.FSWatcher;
		for (watcher of wsConnection.fsWatchers.values()) {
			await watcher.close();
		}
	}
	protected handleFileSystemEvent (browserTabId: string, eventName: string, path: string): void {
		//console.log(`Event: '${eventName}', path: '${path}'.`);
		var wsConnection = this.wsConnections.get(browserTabId) as WsConnection;
		if (wsConnection.socket != null)
			wsConnection.socket.send(JSON.stringify(<WsMessageChange>{
				browserTabId: browserTabId,
				eventName: 'change',
				fsEventName: eventName,
				fsPath: path
			}));
	}


	protected async handleWebSocketClose (browserTabId: string, code: number, reason: Buffer): Promise<void> {
		var wsConnection = this.wsConnections.get(browserTabId) as WsConnection;
		wsConnection.socket = null;
		clearTimeout(wsConnection.stopTimeoutId);
		wsConnection.stopTimeoutId = setTimeout(async () => {
			if (wsConnection.socket == null) {
				await this.stopMonitoring(wsConnection);
				this.removeWsConnection(wsConnection);
			}
		}, this.static.MONITORING_LIFE_TIME);
	}
	protected async handleWebSocketError (browserTabId: string, err: Error): Promise<void> {
		var wsConnection = this.wsConnections.get(browserTabId) as WsConnection;
		await this.stopMonitoring(wsConnection);
		this.removeWsConnection(wsConnection);
	}
	protected removeWsConnection (wsConnection: WsConnection): void {
		if (wsConnection == null) {
			if (this.wsConnections.size === 0) 
				return this.startServerEndInterval();
		}
		this.wsConnections.delete(wsConnection.browserTabId);
		if (this.wsConnections.size === 0) 
			this.startServerEndInterval();
	}
	protected startServerEndInterval (): void {
		this.stopServerEndInterval();
		this.stopServerTimeoutId = setTimeout(() => {
			this.wsServer.close(() => {
				this.httpServer.Stop();
			});
		}, this.static.SERVER_LIFE_TIME);
	}
	protected stopServerEndInterval (): void {
		clearTimeout(this.stopServerTimeoutId);
	}
	protected checkAllCharsBackSlashed (content: string, char: string): boolean {
		var lastPos: number = 0, 
			newPos: number,
			contentLength = content.length,
			posBefore: number,
			escapedChar: boolean,
			allCharsEscaped: boolean = true;
		while (lastPos < contentLength) {
			newPos = content.indexOf(char, lastPos);
			if (newPos === -1) break;
			posBefore = newPos - 1;
			escapedChar = false;
			while (posBefore > lastPos) {
				if (content.substring(posBefore, posBefore + 1) !== '\\') break;
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
	}
	protected getMonitoringPagesCount (): number {
		var count: number = 0;
		for (var wsConn of this.wsConnections.values())
			if (wsConn.monitoring)
				count++;
		return count;
	}
}

var server = WebDevServer.Server.CreateNew();
var app = new App(server);
server
	.SetDocumentRoot(__dirname)
	.SetHostname(process.argv[2])
	.SetPort(parseInt(process.argv[3], 10))
	.SetDevelopment(!false)
	.Start((success, err) => {
		if (success) {
			(async () => {
				await app.Start();
			})();
		}
	});