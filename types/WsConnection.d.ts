declare interface WsConnection {
	browserTabId: string;
	monitoring: boolean;
	socket: WebSocket.WebSocket | null;
	appRoot: string;
	locations: string[];
	excludeRegExps: RegExp[];
	extensionsRegExp: RegExp;
	fsWatchers: Map<string, chokidar.FSWatcher>;
	stopTimeoutId: NodeJS.Timer;
}