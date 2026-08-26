import { QUIZ_BANK } from "../src/lib/quizBank";

let errors = 0;
const ids = new Set<string>();
let total = 0;

for (const [lessonId, pool] of Object.entries(QUIZ_BANK)) {
  if (pool.length < 5) {
    console.error(`✗ ${lessonId}: pool cuma ${pool.length} soal (min 5)`);
    errors++;
  }
  for (const q of pool) {
    total++;
    if (ids.has(q.id)) {
      console.error(`✗ id duplikat: ${q.id}`);
      errors++;
    }
    ids.add(q.id);
    if (!q.q.trim()) {
      console.error(`✗ ${q.id}: pertanyaan kosong`);
      errors++;
    }
    if (q.options.length !== 4) {
      console.error(`✗ ${q.id}: opsi ${q.options.length} (harus 4)`);
      errors++;
    }
    if (q.answer < 0 || q.answer >= q.options.length) {
      console.error(`✗ ${q.id}: kunci jawaban di luar rentang opsi`);
      errors++;
    }
    if (!q.explain.trim()) {
      console.error(`✗ ${q.id}: penjelasan kosong`);
      errors++;
    }
    const dup = new Set(q.options.map((o) => o.trim().toLowerCase()));
    if (dup.size !== q.options.length) {
      console.error(`✗ ${q.id}: ada opsi kembar`);
      errors++;
    }
  }
}

console.log(
  errors === 0
    ? `ALL PASS — ${Object.keys(QUIZ_BANK).length} lesson, ${total} soal valid`
    : `${errors} masalah ditemukan`,
);
process.exit(errors === 0 ? 0 : 1);
