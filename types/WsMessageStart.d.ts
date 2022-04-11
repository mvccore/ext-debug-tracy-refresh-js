declare interface WsMessageStart extends WsMessage {
	appRoot: string;
	locations: string[];
	excludes: string[];
	extensions: string[];
}