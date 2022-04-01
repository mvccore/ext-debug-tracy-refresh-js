import { Server, Request, Response, Session, IApplication } from "web-dev-server";
import WebSocket from "ws";
import { IncomingMessage } from "http";

/**
 * @summary 
 * Exported class to handle directory requests.
 * 
 * When there is first request to directory with default 
 * `index.js` script inside, this class is automatically 
 * created and method `Start()` is executed.
 * All request are normally handled by method `HttpHandle()`.
 * If there is detected any file change inside this file 
 * or inside file included in this file (on development server 
 * instance), the module `web-dev-server` automaticly reloads 
 * all necesssary dependent source codes, stops previous instance 
 * by method `Stop`() and recreates this application instance again
 * by `Start()` method. The same realoding procedure is executed, 
 * if there is any unhandled error inside method `HttpHandle()` 
 * (to develop more comfortably).
 */
export default class App implements IApplication {

	protected server?: Server;
	
	protected wsServer?: WebSocket.Server<WebSocket.WebSocket> | null = null;

	/** @summary Application start point. */
	public async Start (server: Server, firstRequest: Request, firstResponse: Response): Promise<void> {
		this.server = server;
		// Any initializations:
		console.log("App start.");

		this.wsServer = new WebSocket.Server(<WebSocket.ServerOptions>{
			server: server.GetHttpServer()
		});
		/*this.wsServer.on('connection', (
			wsServer: WebSocket.Server<WebSocket.WebSocket>, 
			socket: WebSocket.WebSocket, 
			request: IncomingMessage
		) => {
			this.wsHandleConnection(socket, request as any)
		});*/
	}

	/** 
	 * @summary Application end point, called on unhandled error 
	 * (on development server instance) or on server stop event.
	 */
	public async Stop (server: Server): Promise<void> {
		// Any destructions:
		console.log("App stop.");
		this.wsServer?.close((err?: Error | undefined) => {
			server.Stop();
		});
	}

	/**
	 * @summary 
	 * This method is executed each request to directory with 
	 * `index.js` script inside or into any non-existing directory,
	 * inside directory with this script.
	 */
	public async HttpHandle (request: Request, response: Response): Promise<void> {
		console.log("App http handle.");

		// try to uncomment line bellow to see rendered error in browser:
		//throw new Error("Uncatched test error 1.");

		response
			.SetHeader('content-Type', 'text/javascript')
			.SetBody(
				JSON.stringify({
					basePath: request.GetBasePath(),
					path: request.GetPath(),
					domainUrl: request.GetDomainUrl(),
					baseUrl: request.GetBaseUrl(),
					requestUrl: request.GetRequestUrl(),
					fullUrl: request.GetFullUrl(),
					params: request.GetParams(false, false)
				}, null, "\t")
			)
			.Send();
	}

}