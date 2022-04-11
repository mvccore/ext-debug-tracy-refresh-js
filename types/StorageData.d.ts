declare interface StorageData {
	active: boolean;
	locations: string[];
	excludes: string[];
	extensions: Map<string, boolean>;
	browserTabId: string;
}