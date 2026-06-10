import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CodeEntry, EntriesResponse } from '../types';

const BASE_URL = '/api';

export function useApi() {
  const [entries, setEntries] = useState<CodeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<EntriesResponse>(`${BASE_URL}/entries`);
      setEntries(res.data.entries);
    } catch (err) {
      setError('Failed to load entries from backend. Using demo data.');
      setEntries(getDemoEntries());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const submitCode = useCallback(async (entryId: string, code: string) => {
    try {
      await axios.post(`${BASE_URL}/submit`, { entryId, code });
    } catch {
      console.warn('Submit endpoint unavailable, continuing in demo mode.');
    }
  }, []);

  return { entries, loading, error, refetch: fetchEntries, submitCode };
}

function getDemoEntries(): CodeEntry[] {
  return [
    {
      id: '1',
      title: 'Fibonacci Sequence',
      description:
        'Implement a function that returns the nth Fibonacci number. Your solution should be efficient and handle edge cases like n=0 and n=1.',
      starterCode: `function fibonacci(n: number): number {
  // Your implementation here
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  // TODO: complete this
}

console.log(fibonacci(10)); // Expected: 55`,
      reportCode: `function fibonacci(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// Tests
console.log(fibonacci(0));  // 0
console.log(fibonacci(1));  // 1
console.log(fibonacci(10)); // 55`,
      reportText:
        'The iterative approach has O(n) time complexity and O(1) space. Your recursive implementation would have been O(2^n) without memoization. The key insight is tracking two running values rather than recomputing.',
      reportStatus: { color: 'green', message: 'All tests passed' },
    },
    {
      id: '2',
      title: 'Reverse a Linked List',
      description:
        'Given the head of a singly linked list, reverse the list and return the new head. Implement this in-place without using extra memory.',
      starterCode: `interface ListNode {
  val: number;
  next: ListNode | null;
}

function reverseList(head: ListNode | null): ListNode | null {
  // Your implementation here
}`,
      reportCode: `interface ListNode {
  val: number;
  next: ListNode | null;
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  
  return prev;
}`,
      reportText:
        'Classic three-pointer technique. You must save the next pointer before overwriting it, then redirect the current node backwards. Time: O(n), Space: O(1). Recursive solutions are elegant but risk stack overflow on very long lists.',
      reportStatus: { color: 'green', message: 'Optimal solution' },
    },
    {
      id: '3',
      title: 'Validate Parentheses',
      description:
        'Given a string containing just the characters (, ), {, }, [ and ], determine if the input string is valid. An empty string is also considered valid.',
      starterCode: `function isValid(s: string): boolean {
  // Your implementation here
  // Hint: think about using a stack
}

console.log(isValid("()[]{}"));  // true
console.log(isValid("([)]"));    // false`,
      reportCode: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const pairs: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '[',
  };
  
  for (const char of s) {
    if ('({['.includes(char)) {
      stack.push(char);
    } else if (pairs[char]) {
      if (stack.pop() !== pairs[char]) return false;
    }
  }
  
  return stack.length === 0;
}`,
      reportText:
        'Stack-based approach is canonical here. Push opening brackets, pop and compare when you see a closing bracket. The edge case of an empty stack on a closing bracket is handled implicitly — stack.pop() returns undefined which never matches a valid opener.',
      reportStatus: { color: 'red', message: 'Missing edge case: empty string' },
    },
  ];
}
