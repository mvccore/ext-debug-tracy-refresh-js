declare interface WsMessageChange extends WsMessage {
	fsEventName: string;
	fsPath: string;
}