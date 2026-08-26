import { EXERCISES, exerciseDataset } from "../src/lib/curriculum";
import { runSql } from "../src/lib/sql/engine";

let failed = 0;
for (const ex of EXERCISES) {
  try {
    const res = runSql(ex.solution, exerciseDataset(ex.id));
    console.log(`OK   ${ex.id} (${res.rows.length} rows)`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${ex.id}: ${(e as Error).message}`);
  }
}
console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
