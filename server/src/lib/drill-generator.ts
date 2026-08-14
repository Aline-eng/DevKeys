// Generates a practice text weighted toward a user's weak keys/bigrams by
// picking real English words that contain them, rather than assembling
// pseudo-random gibberish — stays legible and typeable while still
// concentrating repetition on the target characters.
//
// Word-based scoring can only target alphabetic keys (a-z): punctuation
// doesn't occur inside words, so weak symbol keys (';', '/', etc.) don't
// get concentrated here. Curated code snippets already exercise those.

const WORD_LIST = [
  "the","and","for","are","but","not","you","all","can","had","her","was","one","our","out","day",
  "get","has","him","his","how","man","new","now","old","see","two","way","who","boy","did","its",
  "let","put","say","she","too","use","that","with","have","this","will","your","from","they","know",
  "want","been","good","much","some","time","very","when","come","here","just","like","long","make",
  "many","over","such","take","than","them","well","were","what","work","back","call","came","each",
  "even","find","give","hand","high","keep","kind","last","left","life","live","look","most","move",
  "must","name","need","next","only","open","part","play","said","same","seem","show","side","tell",
  "turn","used","warm","week","word","year","after","again","below","could","every","first","found",
  "great","group","house","large","learn","light","might","never","other","place","plant","point",
  "right","small","sound","spell","still","study","their","there","these","thing","think","three",
  "under","water","where","which","world","would","write","about","above","across","almost","always",
  "animal","answer","around","become","before","behind","better","bright","broken","builds","carbon",
  "carry","center","change","circle","cities","close","cloud","coming","common","couple","course",
  "create","design","differ","dollar","during","earth","effect","either","energy","enough","entire",
  "family","figure","follow","forest","forward","friend","garden","gather","ground","happen","happy",
  "having","health","hidden","history","honest","hungry","imagine","inside","island","itself","jungle",
  "kitchen","language","laughing","letter","little","market","matter","middle","minute","mother",
  "mostly","mountain","moving","nation","native","nature","nearby","normal","notice","number","object",
  "obtain","office","orange","origin","output","paint","paper","parent","people","period","person",
  "picture","planet","pocket","police","pretty","prince","produce","program","project","proper",
  "public","purple","purpose","quality","quarter","quick","quiet","radio","raise","reach","reader",
  "really","reason","record","region","remain","report","result","return","reveal","rhythm","river",
  "safety","sample","satisfy","school","season","second","secret","section","segment","sentence",
  "series","settle","shadow","shape","should","signal","simple","single","situate","slowly","smooth",
  "social","solve","source","south","space","special","speech","spirit","spread","spring","square",
  "stable","standard","start","state","story","street","strong","struct","student","subject","summer",
  "supply","surface","surprise","system","table","teacher","temple","though","thread","through",
  "ticket","together","toward","travel","trouble","typical","unable","unless","unique","update",
  "useful","valley","value","vessel","victim","village","virtue","visit","volume","voyage","wander",
  "warmth","wealth","weapon","weather","weekly","weight","whisper","window","winter","wisdom","wonder",
  "wooden","worker","writer","yellow","yester","zephyr",
];

// key_stats/bigram_stats store the raw typed character (case/shift-
// sensitive); word-matching needs the physical lowercase letter, so
// shifted variants collapse onto the same key here — same convention as
// the client's heatmap normalization (client/lib/keyboard-layout.ts).
const SHIFTED_TO_BASE: Record<string, string> = {
  "!": "1", "@": "2", "#": "3", $: "4", "%": "5", "^": "6", "&": "7", "*": "8",
  "(": "9", ")": "0", _: "-", "+": "=", "{": "[", "}": "]", "|": "\\",
  ":": ";", '"': "'", "<": ",", ">": ".", "?": "/", "~": "`",
};

export function normalizeKey(key: string): string {
  if (key.length === 1 && key >= "A" && key <= "Z") return key.toLowerCase();
  return SHIFTED_TO_BASE[key] ?? key;
}

export type WeightedTarget = { key: string; weight: number };

function scoreWord(word: string, keyWeights: Map<string, number>, bigramWeights: Map<string, number>) {
  let score = 0;
  for (let i = 0; i < word.length; i++) {
    score += keyWeights.get(word[i]) ?? 0;
    if (i > 0) {
      score += bigramWeights.get(word[i - 1] + word[i]) ?? 0;
    }
  }
  return score;
}

function weightedSample(scored: { word: string; score: number }[], count: number): string[] {
  const weights = scored.map((s) => s.score + 1); // +1 so every word has a nonzero chance
  const total = weights.reduce((a, b) => a + b, 0);
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    let r = Math.random() * total;
    for (let j = 0; j < scored.length; j++) {
      r -= weights[j];
      if (r <= 0) {
        result.push(scored[j].word);
        break;
      }
    }
  }
  return result;
}

export function generateDrillText(
  weakKeys: WeightedTarget[],
  weakBigrams: WeightedTarget[],
  wordCount = 40,
): string {
  const keyWeights = new Map(weakKeys.map((k) => [k.key, k.weight]));
  const bigramWeights = new Map(weakBigrams.map((b) => [b.key, b.weight]));

  const scored = WORD_LIST.map((word) => ({
    word,
    score: scoreWord(word, keyWeights, bigramWeights),
  }));

  const words = weightedSample(scored, wordCount);
  return words.join(" ");
}
