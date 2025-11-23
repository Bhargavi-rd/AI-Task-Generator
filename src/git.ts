import { exec } from 'child_process';
import { promisify } from 'util';
const execp = promisify(exec);


export interface CommitItem {
hash: string;
subject: string;
body: string;
files?: string[];
diff?: string;
}


export async function gatherCommitsSince(root: string, since: string): Promise<CommitItem[]> {
// Use git log to get commits since a relative time
// Format: hash||subject||body
const cmd = `git -C "${root}" log --since="${since}" --pretty=format:%H||%s||%b --name-only`;
const { stdout } = await execp(cmd);
return parseGitLog(stdout);
}


export async function gatherCommitsRange(root: string, range: string): Promise<CommitItem[]> {
const cmd = `git -C "${root}" log ${range} --pretty=format:%H||%s||%b --name-only`;
const { stdout } = await execp(cmd);
return parseGitLog(stdout);
}


function parseGitLog(raw: string): CommitItem[] {
// Split by blank lines between commits
const blocks = raw.split(/\n(?=[0-9a-f]{40}\|\|)/m);
const commits: CommitItem[] = [];
for (const block of blocks) {
const lines = block.split('\n').filter(Boolean);
if (lines.length === 0) continue;
const header = lines[0];
const [hash, subject, body] = header.split('||');
const files = lines.slice(1).filter(l => !l.startsWith('commit'));
commits.push({ hash, subject, body: body || '', files });
}
return commits;
}