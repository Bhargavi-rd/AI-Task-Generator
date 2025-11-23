import * as vscode from 'vscode';
import { gatherCommitsSince, gatherCommitsRange } from './git';
import { generateTasks } from './ollama';


export function activate(context: vscode.ExtensionContext) {
const generateCmd = vscode.commands.registerCommand('ai-daily-tasks.generate', async () => {
const config = vscode.workspace.getConfiguration('aiDailyTasks');
const since = config.get<string>('since', '1 year');
const workspaceFolders = vscode.workspace.workspaceFolders;
if (!workspaceFolders) {
vscode.window.showErrorMessage('Open a workspace folder to use AI Daily Tasks.');
return;
}
const root = workspaceFolders[0].uri.fsPath;
try {
const commits = await gatherCommitsSince(root, since);
if (!commits || commits.length === 0) {
vscode.window.showInformationMessage('No commits found for the given range.');
return;
}
const panel = vscode.window.createWebviewPanel('aiDailyTasks', 'AI Daily Tasks', vscode.ViewColumn.One, {});
panel.webview.html = getLoadingHtml();
const promptResult = await generateTasks(commits);
panel.webview.html = renderHtml(promptResult);
} catch (err: any) {
vscode.window.showErrorMessage('Failed to generate tasks: ' + String(err.message || err));
}
});


const rangeCmd = vscode.commands.registerCommand('ai-daily-tasks.generateFromRange', async () => {
const range = await vscode.window.showInputBox({ prompt: 'Enter commit range (e.g. HEAD~5..HEAD or 2025-11-14..2025-11-15)' });
if (!range) { return; }
const workspaceFolders = vscode.workspace.workspaceFolders;
if (!workspaceFolders) { vscode.window.showErrorMessage('Open a workspace folder to use AI Daily Tasks.'); return; }
const root = workspaceFolders[0].uri.fsPath;
try {
const commits = await gatherCommitsRange(root, range);
const panel = vscode.window.createWebviewPanel('aiDailyTasks', 'AI Daily Tasks', vscode.ViewColumn.One, {});
panel.webview.html = getLoadingHtml();
const promptResult = await generateTasks(commits);
panel.webview.html = renderHtml(promptResult);
} catch (err: any) {
vscode.window.showErrorMessage('Failed to generate tasks: ' + String(err.message || err));
}
});


context.subscriptions.push(generateCmd, rangeCmd);
}


export function deactivate() {}
function getLoadingHtml() {
return `<html><body><h3>Generating tasks…</h3><p>Please wait</p></body></html>`;
}


function renderHtml(result: { summary: string; tasksCompleted: string[]; nextSteps: string[] }) {
const tasks = result.tasksCompleted.map(t => `<li>${escapeHtml(t)}</li>`).join('\n');
const nexts = result.nextSteps.map(t => `<li>${escapeHtml(t)}</li>`).join('\n');
return `
<html>
<body>
<h2>Daily Summary</h2>
<p>${escapeHtml(result.summary)}</p>
<h3>Tasks Completed</h3>
<ul>${tasks}</ul>
<h3>Possible Next Steps</h3>
<ul>${nexts}</ul>
</body>
</html>`;
}


function escapeHtml(s: string) {
return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]);
}