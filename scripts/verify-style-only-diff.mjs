import process from 'node:process';
import { execFileSync } from 'node:child_process';

const allowContent = process.argv.includes('--allow-content');
const cached = process.argv.includes('--cached');
const protectedPatterns = [
  /^dev-data\//,
  /^src\/data\/(?:contentBlockBlueprints|nativePageContent|.*seed|.*snapshot)/,
  /^src\/lib\/contentAdminSnapshotMigrations\./,
  /^dev-server\/contentAdminStore\./,
];

const diffArgs = ['diff', '--name-only', '--diff-filter=ACMRTUXB'];
if (cached) {
  diffArgs.push('--cached');
}
diffArgs.push('HEAD');

const changedFiles = execFileSync('git', diffArgs, { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);
if (!cached) {
  execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)
    .forEach((file) => changedFiles.push(file));
}
const uniqueChangedFiles = [...new Set(changedFiles)].sort();
const protectedFiles = uniqueChangedFiles.filter((file) => protectedPatterns.some((pattern) => pattern.test(file)));

if (protectedFiles.length && !allowContent) {
  console.error('Style-only diff blocked: protected content/snapshot files changed.');
  protectedFiles.forEach((file) => console.error('  ' + file));
  console.error('Use --allow-content only when the change intentionally includes a content migration.');
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    styleOnly: !allowContent,
    changedFiles: uniqueChangedFiles,
    protectedFiles,
  }, null, 2));
}
