import { Console } from 'console';
import { types } from 'util';
import * as vscode from 'vscode';
import { getNonce } from './util';

const yaml = require('js-yaml');

/**
 * Provider for RONALD editor
 */
export class RonaldEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new RonaldEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(RonaldEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'ronaldCustoms.ronald';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Called when our custom editor is opened.
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {

		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		function updateWebview() {

			try {
				webviewPanel.webview.postMessage({
					type: 'update',
					text: JSON.stringify(yaml.load(document.getText()))
				});
			}
			catch(e) {
				console.log(e);
			}
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			console.log(e.type);
			return;
/* 			switch (e.type) {
				case 'add':
					this.addNewScratch(document);
					return;

				case 'delete':
					this.deleteScratch(document, e.id);
					return;
			} */
		});

		updateWebview();
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'ronald.js'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'vscode.css'));

		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'ronald.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleMainUri}" rel="stylesheet" />

				<title>Ronald Editor</title>
			</head>
			<body>
				<div class="ronald">
				</div>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	/**
	 * Add a new scratch to the current document.
	 */
/* 	private addNewScratch(document: vscode.TextDocument) {
		const json = this.getDocumentAsJson(document);
		const character = RonaldEditorProvider.scratchCharacters[Math.floor(Math.random() * RonaldEditorProvider.scratchCharacters.length)];
		json.scratches = [
			...(Array.isArray(json.scratches) ? json.scratches : []),
			{
				id: getNonce(),
				text: character,
				created: Date.now(),
			}
		];

		return this.updateTextDocument(document, json);
	} */

	/**
	 * Delete an existing scratch from a document.
	 */
/* 	private deleteScratch(document: vscode.TextDocument, id: string) {
		const json = this.getDocumentAsJson(document);
		if (!Array.isArray(json.scratches)) {
			return;
		}

		json.scratches = json.scratches.filter((note: any) => note.id !== id);

		return this.updateTextDocument(document, json);
	} */

	/**
	 * Try to get a current document as json text.
	 */
/* 	private getDocumentAsJson(document: vscode.TextDocument): any {
		const text = document.getText();
		if (text.trim().length === 0) {
			return {};
		}

		try {
			// Get document, or throw exception on error
			return JSON.parse(yaml.load(document.getText()))
		} catch {
			throw new Error('Could not get document as json. Content is not valid json');
		}
	} */

	/**
	 * Write out the json to a given document.
	 */
/* 	private updateTextDocument(document: vscode.TextDocument, json: any) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			yaml.stringify(json, null, 2));
		
		return vscode.workspace.applyEdit(edit);
	} */
}
