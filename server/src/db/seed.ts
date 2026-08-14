import "dotenv/config";
import { db, pool } from "./db.js";
import { practiceTexts } from "./schema.js";

type SeedText = {
  title: string;
  body: string;
  category: "code" | "prose" | "quote";
  difficulty: number;
};

const texts: SeedText[] = [
  {
    title: "JS: array sum",
    category: "code",
    difficulty: 1,
    body: `function sum(numbers) {\n  return numbers.reduce((total, n) => total + n, 0);\n}`,
  },
  {
    title: "JS: debounce",
    category: "code",
    difficulty: 3,
    body: `function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}`,
  },
  {
    title: "TS: generic identity",
    category: "code",
    difficulty: 2,
    body: `function identity<T>(value: T): T {\n  return value;\n}\n\nconst result = identity<string>("hello");`,
  },
  {
    title: "Python: fibonacci",
    category: "code",
    difficulty: 2,
    body: `def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a`,
  },
  {
    title: "Python: list comprehension",
    category: "code",
    difficulty: 1,
    body: `squares = [x * x for x in range(10) if x % 2 == 0]`,
  },
  {
    title: "SQL: join and filter",
    category: "code",
    difficulty: 2,
    body: `SELECT u.id, u.email, COUNT(a.id) AS attempts\nFROM users u\nJOIN typing_attempts a ON a.user_id = u.id\nWHERE a.completed_at > NOW() - INTERVAL '7 days'\nGROUP BY u.id, u.email;`,
  },
  {
    title: "Regex: email match",
    category: "code",
    difficulty: 4,
    body: `const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nconst isValid = emailPattern.test(input.trim());`,
  },
  {
    title: "Bash: find and replace",
    category: "code",
    difficulty: 3,
    body: `grep -rl "oldValue" ./src | xargs sed -i 's/oldValue/newValue/g'`,
  },
  {
    title: "Rust: option handling",
    category: "code",
    difficulty: 4,
    body: `fn parse_port(input: &str) -> Option<u16> {\n    input.trim().parse::<u16>().ok()\n}`,
  },
  {
    title: "Vim motions",
    category: "code",
    difficulty: 3,
    body: `dd yy p P ciw daw gg G :%s/foo/bar/g ZZ`,
  },
  {
    title: "Prose: focus",
    category: "prose",
    difficulty: 1,
    body: `The keyboard is the quietest instrument a programmer owns, yet it carries every idea from mind to screen without a single wasted motion.`,
  },
  {
    title: "Prose: practice",
    category: "prose",
    difficulty: 2,
    body: `Good typists are not born fast. They are built one deliberate repetition at a time, correcting the same small mistake until it simply stops happening.`,
  },
  {
    title: "Quote: Knuth",
    category: "quote",
    difficulty: 2,
    body: `Programs are meant to be read by humans and only incidentally for computers to execute.`,
  },
  {
    title: "Quote: Kernighan",
    category: "quote",
    difficulty: 2,
    body: `Controlling complexity is the essence of computer programming.`,
  },
];

async function main() {
  const rows = texts.map((t) => ({
    title: t.title,
    body: t.body,
    category: t.category,
    difficulty: t.difficulty,
    charCount: t.body.length,
  }));

  await db.insert(practiceTexts).values(rows);
  console.log(`Seeded ${rows.length} practice texts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
