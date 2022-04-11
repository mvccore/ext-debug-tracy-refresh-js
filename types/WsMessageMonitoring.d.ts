declare interface WsMessageMonitoring extends WsMessage {
	monitoringPagesCount: number;
	locations: string[];
	excludes: string[];
	extensions: string[];
}