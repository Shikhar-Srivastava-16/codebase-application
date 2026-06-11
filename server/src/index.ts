import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// ── Config ────────────────────────────────────────────────────────────────────

const SOLUTIONS_DIR = '/home/shikhar/yotta/tmp/python-P1';
const DATA_DIR = path.resolve(__dirname, '../../data');

interface EntryData {
  file: string;
  bounds: [number, number];
  tests: string[];
}

interface ReportStatus {
  color: 'red' | 'green';
  message?: string;
}

interface CodeEntry {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  reportCode: string;
  reportText: string;
  reportStatus: ReportStatus;
  fileName: string;
}

interface InternalEntry extends CodeEntry {
  tests: string[];
  file: string;
}

// ── Load entries ──────────────────────────────────────────────────────────────

function loadEntries(): InternalEntry[] {
  const entriesPath = path.join(DATA_DIR, 'entries.json');
  const raw = JSON.parse(fs.readFileSync(entriesPath, 'utf-8')) as EntryData[];

  return raw.map((entry, i) => {
    const sourcePath = path.join(SOLUTIONS_DIR, entry.file);
    const fullContent = fs.readFileSync(sourcePath, 'utf-8');
    const lines = fullContent.split('\n');

    const [start, end] = entry.bounds;
    const linesBefore = lines.slice(0, start - 1);
    const linesAfter = lines.slice(end);

    const placeholder = `# ── TODO: implement this section (lines ${start}-${end}) ──\n# Your implementation here\n# ────────────────────────────────────────`;
    const starterCode = [...linesBefore, placeholder, ...linesAfter].join('\n');
    const reportCode = fullContent;

    const fileName = path.basename(entry.file);
    const title = `${fileName}: lines ${start}-${end}`;
    const description = `Implement the code at lines ${start}-${end} of ${entry.file}. The solution must pass all associated tests (${entry.tests.length} test(s)).`;
    const reportText = `The reference for lines ${start}-${end} of ${entry.file} is shown on the right. Your code runs against ${entry.tests.length} test(s).`;

    return {
      id: String(i + 1),
      title,
      description,
      starterCode,
      reportCode,
      reportText,
      reportStatus: { color: 'green', message: 'Ready to submit' },
      fileName,
      tests: entry.tests,
      file: entry.file,
    };
  });
}

// ── Test runner ────────────────────────────────────────────────────────────────

function testPathToPytest(testPath: string): string {
  const parts = testPath.split('.');
  const method = parts.pop()!;
  const cls = parts.pop()!;
  const filePath = parts.join('/') + '.py';
  return `${filePath}::${cls}::${method}`;
}

function runTests(entry: InternalEntry, code: string): { reportStatus: ReportStatus; testOutput: string } {
  const tmpDir = fs.mkdtempSync('/tmp/codereview-');
  try {
    const origSrcDir = path.join(SOLUTIONS_DIR, 'src');
    const origTestsDir = path.join(SOLUTIONS_DIR, 'tests');
    const tmpSrcDir = path.join(tmpDir, 'src');
    const tmpTestsDir = path.join(tmpDir, 'tests');
    fs.cpSync(origSrcDir, tmpSrcDir, { recursive: true });
    fs.cpSync(origTestsDir, tmpTestsDir, { recursive: true });

    const targetPath = path.join(tmpSrcDir, path.basename(entry.file));
    fs.writeFileSync(targetPath, code, 'utf-8');

    const testNodes = entry.tests.map(testPathToPytest).join(' ');
    const env = { ...process.env, PYTHONPATH: tmpDir };
    const cmd = `python3 -m pytest ${testNodes} -v --no-header -q 2>&1`;

    const stdout = execSync(cmd, { cwd: tmpDir, timeout: 30000, encoding: 'utf-8', env });
    return {
      reportStatus: { color: 'green', message: 'All tests passed' },
      testOutput: stdout.trim(),
    };
  } catch (err: any) {
    const output = (err.stdout || err.stderr || err.message || '') as string;
    const lines = output.trim().split('\n');
    const summary =
      lines.find((l) => /^(FAILED|ERROR|\d+ (failed|passed))/i.test(l)) ||
      lines[lines.length - 1] ||
      'Tests failed';
    return {
      reportStatus: { color: 'red', message: summary },
      testOutput: output.trim(),
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────

let entries: InternalEntry[];
try {
  entries = loadEntries();
  console.log(`Loaded ${entries.length} entries from entries.json`);
} catch (err) {
  console.error('Failed to load entries:', err);
  process.exit(1);
}

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get('/api/entries', (_req: Request, res: Response) => {
  const publicEntries = entries.map(({ tests, file, ...e }) => e);
  res.json({ entries: publicEntries, total: publicEntries.length });
});

app.get('/api/entries/:id', (req: Request, res: Response) => {
  const entry = entries.find((e) => e.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  const { tests, file, ...publicEntry } = entry;
  res.json({ entry: publicEntry });
});

app.post('/api/submit', (req: Request, res: Response) => {
  const { entryId, code } = req.body as { entryId?: string; code?: string };

  if (!entryId || code === undefined) {
    res.status(400).json({ error: 'entryId and code are required' });
    return;
  }

  const entry = entries.find((e) => e.id === entryId);
  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  const { reportStatus, testOutput } = runTests(entry, code);
  entry.reportStatus = reportStatus;

  res.json({ ok: true, entryId, reportStatus, testOutput });
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
