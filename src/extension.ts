import * as vscode from 'vscode';
import { RonaldEditorProvider } from './ronaldEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(RonaldEditorProvider.register(context));
}
