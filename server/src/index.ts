import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ── Types ──────────────────────────────────────────────────────────────────────

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
}

// ── Data store (replace with your DB layer) ────────────────────────────────────

const entries: CodeEntry[] = [
  {
    id: '1',
    title: 'Fibonacci Sequence',
    description:
      'Implement a function that returns the nth Fibonacci number. Your solution should be efficient and handle edge cases like n=0 and n=1.',
    starterCode: `function fibonacci(n: number): number {\n  // Your implementation here\n}`,
    reportCode: `function fibonacci(n: number): number {\n  if (n <= 0) return 0;\n  if (n === 1) return 1;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];\n  return b;\n}`,
    reportText:
      'The iterative approach has O(n) time complexity and O(1) space, versus O(2^n) for naive recursion.',
    reportStatus: { color: 'green', message: 'All tests passed' },
  },
  {
    id: '2',
    title: 'Reverse a Linked List',
    description:
      'Given the head of a singly linked list, reverse the list and return the new head.',
    starterCode: `function reverseList(head: ListNode | null): ListNode | null {\n  // Your implementation here\n}`,
    reportCode: `function reverseList(head: ListNode | null): ListNode | null {\n  let prev = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`,
    reportText:
      'Classic three-pointer technique. Time O(n), Space O(1). Recursive solutions risk stack overflow on very long lists.',
    reportStatus: { color: 'green', message: 'Optimal solution' },
  },
];

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/entries
 * Returns all exercises to display in the UI.
 */
app.get('/api/entries', (_req: Request, res: Response) => {
  res.json({ entries, total: entries.length });
});

/**
 * GET /api/entries/:id
 * Returns a single exercise by id.
 */
app.get('/api/entries/:id', (req: Request, res: Response) => {
  const entry = entries.find((e) => e.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json({ entry });
});

/**
 * POST /api/submit
 * Accepts the user's code for an exercise.
 * Body: { entryId: string; code: string }
 *
 * Here you would run tests, lint, or AI review and return a result.
 * For now it echoes back a simple acknowledgement.
 */
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

  // TODO: run your tests / AI grading here and update entry.reportStatus
  console.log(`[submit] entry=${entryId}, codeLength=${code.length}`);

  res.json({ ok: true, entryId, reportStatus: entry.reportStatus });
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
