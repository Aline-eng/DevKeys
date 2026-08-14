// Physical US-QWERTY layout for the weak-key heatmap. Widths are relative
// units (1 = a standard 1u key).
export type KeyboardKey = { label: string; base: string; width?: number };

export const KEYBOARD_ROWS: KeyboardKey[][] = [
  [
    { label: "`", base: "`" },
    { label: "1", base: "1" },
    { label: "2", base: "2" },
    { label: "3", base: "3" },
    { label: "4", base: "4" },
    { label: "5", base: "5" },
    { label: "6", base: "6" },
    { label: "7", base: "7" },
    { label: "8", base: "8" },
    { label: "9", base: "9" },
    { label: "0", base: "0" },
    { label: "-", base: "-" },
    { label: "=", base: "=" },
  ],
  [
    { label: "q", base: "q" },
    { label: "w", base: "w" },
    { label: "e", base: "e" },
    { label: "r", base: "r" },
    { label: "t", base: "t" },
    { label: "y", base: "y" },
    { label: "u", base: "u" },
    { label: "i", base: "i" },
    { label: "o", base: "o" },
    { label: "p", base: "p" },
    { label: "[", base: "[" },
    { label: "]", base: "]" },
    { label: "\\", base: "\\" },
  ],
  [
    { label: "a", base: "a" },
    { label: "s", base: "s" },
    { label: "d", base: "d" },
    { label: "f", base: "f" },
    { label: "g", base: "g" },
    { label: "h", base: "h" },
    { label: "j", base: "j" },
    { label: "k", base: "k" },
    { label: "l", base: "l" },
    { label: ";", base: ";" },
    { label: "'", base: "'" },
  ],
  [
    { label: "z", base: "z" },
    { label: "x", base: "x" },
    { label: "c", base: "c" },
    { label: "v", base: "v" },
    { label: "b", base: "b" },
    { label: "n", base: "n" },
    { label: "m", base: "m" },
    { label: ",", base: "," },
    { label: ".", base: "." },
    { label: "/", base: "/" },
  ],
  [{ label: "space", base: " ", width: 8 }],
];

// Maps a shifted symbol/uppercase letter back to the physical key it shares
// with its unshifted character, so "A" and "a" (or "!" and "1") aggregate
// onto the same box in the heatmap rather than fragmenting the per-key data.
const SHIFTED_TO_BASE: Record<string, string> = {
  "~": "`",
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  _: "-",
  "+": "=",
  "{": "[",
  "}": "]",
  "|": "\\",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
};

export function normalizeKeyForHeatmap(key: string): string {
  if (key.length === 1 && key >= "A" && key <= "Z") {
    return key.toLowerCase();
  }
  return SHIFTED_TO_BASE[key] ?? key;
}
