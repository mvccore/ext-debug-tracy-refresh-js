declare interface WsMessage {
	eventName: 'start' | 'stop' | 'monitoring' | 'stopped' | 'change';
	browserTabId: string;
}