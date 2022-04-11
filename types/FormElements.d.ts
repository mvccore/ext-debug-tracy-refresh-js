declare interface FormElements {
	form: HTMLFormElement;
	locations: HTMLTextAreaElement;
	excludes: HTMLTextAreaElement;
	extensions: Map<string, HTMLINputElement>;
	start: HTMLButtonElement;
	statusText: HTMLElement;
	activePagesCount: HTMLSpanElement;
}