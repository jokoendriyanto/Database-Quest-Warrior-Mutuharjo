/**
 * Mini SQL engine — a safe, in-memory subset of MySQL used for the
 * Database Quest SQL sandbox. Runs identically on client (instant preview)
 * and server (authoritative validation).
 *
 * Supported:
 *   SELECT [DISTINCT] items FROM t
 *     [INNER|LEFT JOIN t2 ON a = b] [WHERE ...] [GROUP BY cols]
 *     [ORDER BY col [ASC|DESC], ...] [LIMIT n]
 *   INSERT INTO t [(cols)] VALUES (...), (...)
 *   UPDATE t SET c = v, ... [WHERE ...]
 *   DELETE FROM t [WHERE ...]
 *
 * Expressions: = != <> > < >= <= AND OR NOT LIKE IN BETWEEN IS NULL,
 * parentheses, COUNT/SUM/AVG/MIN/MAX, column aliases with AS.
 */

export class SqlError extends Error {
  code: string;
  suggestion?: string;
  constructor(code: string, message: string, suggestion?: string) {
    super(message);
    this.code = code;
    this.suggestion = suggestion;
  }
}

type Row = Record<string, unknown>;
export interface Table {
  name: string;
  columns: string[];
  rows: Row[];
}
export type Database = Record<string, Table>;

interface SelectItem {
  expr: Expr;
  alias?: string;
}
interface OrderItem {
  col: string;
  dir: "asc" | "desc";
}
interface JoinClause {
  table: TableRef;
  type: "inner" | "left";
  onLeft: string;
  onRight: string;
}
interface TableRef {
  name: string;
  alias?: string;
}
interface SelectStmt {
  type: "select";
  distinct: boolean;
  items: ("*" | SelectItem)[];
  from: TableRef;
  join?: JoinClause;
  where?: Expr;
  groupBy?: string[];
  orderBy?: OrderItem[];
  limit?: number;
}
interface InsertStmt {
  type: "insert";
  table: string;
  columns?: string[];
  values: unknown[][];
}
interface UpdateStmt {
  type: "update";
  table: string;
  sets: { col: string; value: Expr }[];
  where?: Expr;
}
interface DeleteStmt {
  type: "delete";
  table: string;
  where?: Expr;
}
type Stmt = SelectStmt | InsertStmt | UpdateStmt | DeleteStmt;

type Expr =
  | { kind: "col"; name: string }
  | { kind: "lit"; value: unknown }
  | { kind: "star" }
  | { kind: "not"; e: Expr }
  | { kind: "and"; l: Expr; r: Expr }
  | { kind: "or"; l: Expr; r: Expr }
  | { kind: "cmp"; op: string; l: Expr; r: Expr }
  | { kind: "like"; l: Expr; pattern: string }
  | { kind: "in"; l: Expr; list: Expr[] }
  | { kind: "between"; l: Expr; lo: Expr; hi: Expr }
  | { kind: "isnull"; e: Expr; negated: boolean }
  | { kind: "agg"; fn: string; arg: Expr | "*" };

/* ----------------------------- Tokenizer ----------------------------- */

const KEYWORDS = new Set([
  "select","distinct","from","where","group","by","order","limit","as",
  "insert","into","values","update","set","delete","join","inner","left",
  "right","on","and","or","not","like","in","between","is","null","asc",
  "desc","count","sum","avg","min","max",
]);

interface Token {
  type: "ident" | "kw" | "num" | "str" | "op";
  value: string;
}

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = sql.trim();
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "-" && s[i + 1] === "-") { while (i < s.length && s[i] !== "\n") i++; continue; }
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let j = i + 1;
      let out = "";
      while (j < s.length) {
        if (s[j] === "\\" && j + 1 < s.length) { out += s[j + 1]; j += 2; continue; }
        if (s[j] === quote) {
          if (s[j + 1] === quote) { out += quote; j += 2; continue; }
          break;
        }
        out += s[j++];
      }
      if (j >= s.length) throw new SqlError("ER_PARSE", "Ada tanda kutip yang belum ditutup. Cek lagi ya. 🤔");
      tokens.push({ type: "str", value: out });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(s[i + 1] ?? ""))) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ type: "num", value: s.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9_.]/.test(s[j])) j++;
      // allow qualified `table.col`
      const word = s.slice(i, j);
      const lower = word.toLowerCase();
      tokens.push({ type: KEYWORDS.has(lower.split(".").pop() ?? lower) && !word.includes(".") ? "kw" : "ident", value: word });
      i = j;
      continue;
    }
    if (ch === "`") {
      let j = i + 1;
      while (j < s.length && s[j] !== "`") j++;
      tokens.push({ type: "ident", value: s.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (["<=", ">=", "!=", "<>", "="].includes(two)) {
      tokens.push({ type: "op", value: two === "<>" ? "!=" : two });
      i += 2;
      continue;
    }
    if ("<>()*,;".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    throw new SqlError("ER_PARSE", `Karakter "${ch}" nggak dikenal di query kamu.`);
  }
  return tokens;
}

/* ------------------------------ Parser ------------------------------- */

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}
  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private next(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new SqlError("ER_PARSE", "Query-nya kelihatannya belum selesai. 🤔");
    this.pos++;
    return t;
  }
  private isKw(...kws: string[]): boolean {
    const t = this.peek();
    return !!t && t.type === "kw" && kws.includes(t.value.toLowerCase());
  }
  private eatKw(kw: string): boolean {
    if (this.isKw(kw)) { this.next(); return true; }
    return false;
  }
  private expectKw(kw: string) {
    if (!this.eatKw(kw))
      throw new SqlError("ER_PARSE", `Aku nyari keyword ${kw.toUpperCase()} tapi nggak ketemu. Cek struktur query-mu ya.`);
  }
  private expectOp(op: string) {
    const t = this.next();
    if (!(t.type === "op" && t.value === op))
      throw new SqlError("ER_PARSE", `Aku expect "${op}" tapi dapat "${t.value}".`);
  }

  parseStatement(): Stmt {
    if (this.isKw("select")) return this.parseSelect();
    if (this.isKw("insert")) return this.parseInsert();
    if (this.isKw("update")) return this.parseUpdate();
    if (this.isKw("delete")) return this.parseDelete();
    throw new SqlError("ER_PARSE", "Query harus dimulai dengan SELECT, INSERT, UPDATE, atau DELETE.");
  }

  private parseSelect(): SelectStmt {
    this.expectKw("select");
    const distinct = this.eatKw("distinct");
    const items: ("*" | SelectItem)[] = [];
    do {
      if (this.peek()?.type === "op" && this.peek()!.value === "*") {
        this.next();
        items.push("*");
        continue;
      }
      const expr = this.parseExpr();
      let alias: string | undefined;
      if (this.eatKw("as")) {
        const t = this.next();
        alias = t.value;
      } else if (this.peek() && this.peek()!.type === "ident") {
        alias = this.next().value;
      }
      items.push({ expr, alias });
    } while (this.eatComma());

    this.expectKw("from");
    const from = this.parseTableRef();
    let join: JoinClause | undefined;
    while (this.isKw("inner", "left", "right", "cross", "join")) {
      let type: "inner" | "left" = "inner";
      if (this.eatKw("inner")) type = "inner";
      else if (this.eatKw("left")) type = "left";
      else if (this.isKw("right", "cross")) {
        const kw = this.next().value.toUpperCase();
        throw new SqlError(
          "ER_UNSUPPORTED",
          `${kw} JOIN belum didukung di sandbox ini. Coba pakai LEFT JOIN atau INNER JOIN ya!`,
        );
      }
      this.expectKw("join");
      const table = this.parseTableRef();
      this.expectKw("on");
      const l = this.parseExpr() as { kind: "col"; name: string };
      this.expectOp("=");
      const r = this.parseExpr() as { kind: "col"; name: string };
      if (l.kind !== "col" || r.kind !== "col")
        throw new SqlError("ER_PARSE", " kondisi ON harus berupa perbandingan dua kolom, contoh: ON students.class_id = classes.id");
      join = { table, type, onLeft: l.name, onRight: r.name };
    }

    let where: Expr | undefined;
    if (this.eatKw("where")) where = this.parseExpr();

    let groupBy: string[] | undefined;
    if (this.isKw("group")) {
      this.next();
      this.expectKw("by");
      groupBy = [];
      do {
        const t = this.next();
        if (t.type !== "ident" && t.type !== "kw")
          throw new SqlError("ER_PARSE", "GROUP BY butuh nama kolom.");
        groupBy.push(t.value);
      } while (this.eatComma());
    }

    let orderBy: OrderItem[] | undefined;
    if (this.isKw("order")) {
      this.next();
      this.expectKw("by");
      orderBy = [];
      do {
        const t = this.next();
        if (t.type !== "ident" && t.type !== "kw")
          throw new SqlError("ER_PARSE", "ORDER BY butuh nama kolom.");
        let dir: "asc" | "desc" = "asc";
        if (this.eatKw("asc")) dir = "asc";
        else if (this.eatKw("desc")) dir = "desc";
        orderBy.push({ col: t.value, dir });
      } while (this.eatComma());
    }

    let limit: number | undefined;
    if (this.eatKw("limit")) {
      const t = this.next();
      if (t.type !== "num") throw new SqlError("ER_PARSE", "LIMIT butuh angka, contoh: LIMIT 5");
      limit = parseInt(t.value, 10);
    }

    this.eatSemicolon();
    return { type: "select", distinct, items, from, join, where, groupBy, orderBy, limit };
  }

  private parseTableRef(): TableRef {
    const t = this.next();
    if (t.type !== "ident" && t.type !== "kw")
      throw new SqlError("ER_PARSE", "Nama tabel nggak terbaca. Contoh: FROM students");
    let alias: string | undefined;
    if (this.eatKw("as")) alias = this.next().value;
    else if (this.peek() && this.peek()!.type === "ident") alias = this.next().value;
    return { name: t.value, alias };
  }

  private parseInsert(): InsertStmt {
    this.expectKw("insert");
    this.expectKw("into");
    const table = this.next().value;
    let columns: string[] | undefined;
    if (this.peek()?.value === "(") {
      this.next();
      columns = [];
      do {
        columns.push(this.next().value);
      } while (this.eatComma());
      this.expectOp(")");
    }
    this.expectKw("values");
    const values: unknown[][] = [];
    do {
      this.expectOp("(");
      const row: unknown[] = [];
      do {
        row.push(this.parseLiteralOrCol());
      } while (this.eatComma());
      this.expectOp(")");
      values.push(row);
    } while (this.eatComma());
    this.eatSemicolon();
    return { type: "insert", table, columns, values };
  }

  private parseLiteralOrCol(): unknown {
    const t = this.peek();
    if (t && (t.type === "num" || t.type === "str")) { this.next(); return Number.isNaN(Number(t.value)) ? t.value : Number(t.value); }
    if (t && t.type === "kw" && t.value.toLowerCase() === "null") { this.next(); return null; }
    if (t && (t.type === "ident" || t.type === "kw")) { this.next(); return t.value; }
    throw new SqlError("ER_PARSE", "Nilai di VALUES nggak valid. String pakai tanda kutip 'gini'.");
  }

  private parseUpdate(): UpdateStmt {
    this.expectKw("update");
    const table = this.next().value;
    this.expectKw("set");
    const sets: { col: string; value: Expr }[] = [];
    do {
      const col = this.next().value;
      this.expectOp("=");
      sets.push({ col, value: this.parseExpr() });
    } while (this.eatComma());
    let where: Expr | undefined;
    if (this.eatKw("where")) where = this.parseExpr();
    this.eatSemicolon();
    return { type: "update", table, sets, where };
  }

  private parseDelete(): DeleteStmt {
    this.expectKw("delete");
    this.expectKw("from");
    const table = this.next().value;
    let where: Expr | undefined;
    if (this.eatKw("where")) where = this.parseExpr();
    this.eatSemicolon();
    return { type: "delete", table, where };
  }

  private eatComma(): boolean {
    if (this.peek()?.value === ",") { this.next(); return true; }
    return false;
  }
  private eatSemicolon() {
    if (this.peek()?.value === ";") this.next();
  }

  /* expression parsing with precedence: OR < AND < NOT < comparison */
  parseExpr(): Expr {
    return this.parseOr();
  }
  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.isKw("or")) { this.next(); left = { kind: "or", l: left, r: this.parseAnd() }; }
    return left;
  }
  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.isKw("and")) { this.next(); left = { kind: "and", l: left, r: this.parseNot() }; }
    return left;
  }
  private parseNot(): Expr {
    if (this.isKw("not")) { this.next(); return { kind: "not", e: this.parseNot() }; }
    return this.parseComparison();
  }
  private parseComparison(): Expr {
    const left = this.parsePrimary();
    const t = this.peek();
    if (t?.type === "op" && ["=", "!=", ">", "<", ">=", "<="].includes(t.value)) {
      this.next();
      const right = this.parsePrimary();
      return { kind: "cmp", op: t.value, l: left, r: right };
    }
    if (this.isKw("like")) {
      this.next();
      const p = this.next();
      if (p.type !== "str") throw new SqlError("ER_PARSE", "LIKE butuh pola string, contoh: LIKE '%gmail%'");
      return { kind: "like", l: left, pattern: p.value };
    }
    if (this.isKw("in")) {
      this.next();
      this.expectOp("(");
      const list: Expr[] = [];
      do { list.push(this.parsePrimary()); } while (this.eatComma());
      this.expectOp(")");
      return { kind: "in", l: left, list };
    }
    if (this.isKw("between")) {
      this.next();
      const lo = this.parsePrimary();
      this.expectKw("and");
      const hi = this.parsePrimary();
      return { kind: "between", l: left, lo, hi };
    }
    if (this.isKw("is")) {
      this.next();
      const negated = this.eatKw("not");
      this.expectKw("null");
      return { kind: "isnull", e: left, negated };
    }
    return left;
  }
  private parsePrimary(): Expr {
    const t = this.peek();
    if (!t) throw new SqlError("ER_PARSE", "Ekspresi nggak lengkap.");
    if (t.type === "num" || t.type === "str") { this.next(); return { kind: "lit", value: Number.isNaN(Number(t.value)) ? t.value : Number(t.value) }; }
    if (t.type === "kw" && t.value.toLowerCase() === "null") { this.next(); return { kind: "lit", value: null }; }
    if (t.value === "(") {
      this.next();
      const e = this.parseExpr();
      this.expectOp(")");
      return e;
    }
    if ((t.type === "kw" || t.type === "ident") && ["count", "sum", "avg", "min", "max"].includes(t.value.toLowerCase())) {
      this.next();
      this.expectOp("(");
      let arg: Expr | "*";
      if (this.peek()?.value === "*") { this.next(); arg = { kind: "star" }; }
      else arg = this.parseExpr();
      this.expectOp(")");
      return { kind: "agg", fn: t.value.toLowerCase(), arg };
    }
    if (t.type === "op" && t.value === "*") { this.next(); return { kind: "star" }; }
    this.next();
    if (t.type !== "ident" && t.type !== "kw")
      throw new SqlError("ER_PARSE", `"${t.value}" bukan nama kolom atau nilai yang valid.`);
    return { kind: "col", name: t.value };
  }
}

/* ---------------------------- Execution ------------------------------ */

function findTable(db: Database, ref: TableRef): Table {
  const key = Object.keys(db).find((k) => k.toLowerCase() === ref.name.toLowerCase());
  if (!key)
    throw new SqlError(
      "ER_NO_TABLE",
      `Hmm... tabel \`${ref.name}\` nggak ada di database ini. 🤔`,
      `Tabel yang tersedia: ${Object.keys(db).join(", ")}`,
    );
  return db[key];
}

function resolveColumn(row: Row, tablesInRow: string[], name: string): unknown {
  if (name in row) return row[name];
  const lower = name.toLowerCase();
  const matchKey = Object.keys(row).find((k) => k.toLowerCase() === lower);
  if (matchKey) return row[matchKey];
  const qual = lower.includes(".") ? lower : null;
  if (qual) {
    const m = Object.keys(row).find((k) => k.toLowerCase() === qual);
    if (m) return row[m];
  }
  void tablesInRow;
  throw new SqlError(
    "ER_BAD_COLUMN",
    `Kolom \`${name}\` nggak ketemu. 🤔`,
    `Kolom yang tersedia di hasil query ini: ${Object.keys(row).slice(0, 12).map((c) => `\`${c}\``).join(", ")}`,
  );
}

function looseEquals(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a); const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function likeToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

function evalExpr(e: Expr, row: Row, tables: string[], aggRows?: Row[]): unknown {
  switch (e.kind) {
    case "lit": return e.value;
    case "star": return "*";
    case "col": return resolveColumn(row, tables, e.name);
    case "not": return !truthy(evalExpr(e.e, row, tables, aggRows));
    case "and": return truthy(evalExpr(e.l, row, tables, aggRows)) && truthy(evalExpr(e.r, row, tables, aggRows));
    case "or": return truthy(evalExpr(e.l, row, tables, aggRows)) || truthy(evalExpr(e.r, row, tables, aggRows));
    case "isnull": {
      const v = evalExpr(e.e, row, tables, aggRows);
      return e.negated ? v != null : v == null;
    }
    case "like": {
      const v = evalExpr(e.l, row, tables, aggRows);
      return v != null && likeToRegex(e.pattern).test(String(v));
    }
    case "in": {
      const v = evalExpr(e.l, row, tables, aggRows);
      return e.list.some((item) => looseEquals(v, evalExpr(item, row, tables, aggRows)));
    }
    case "between": {
      const v = evalExpr(e.l, row, tables, aggRows);
      const lo = evalExpr(e.lo, row, tables, aggRows);
      const hi = evalExpr(e.hi, row, tables, aggRows);
      return compare(v, lo) >= 0 && compare(v, hi) <= 0;
    }
    case "cmp": {
      const l = evalExpr(e.l, row, tables, aggRows);
      const r = evalExpr(e.r, row, tables, aggRows);
      if (e.op === "=") return looseEquals(l, r);
      if (e.op === "!=") return !looseEquals(l, r);
      const c = compare(l, r);
      if (e.op === ">") return c > 0;
      if (e.op === "<") return c < 0;
      if (e.op === ">=") return c >= 0;
      return c <= 0;
    }
    case "agg": {
      if (!aggRows) throw new SqlError("ER_MISPLACED_AGG", `Fungsi agregat ${e.fn.toUpperCase()}() cuma bisa dipakai di SELECT.`);
      const rows = aggRows as (Row & { __tables__: string[] })[];
      if (e.fn === "count") {
        if (e.arg.kind === "star") return rows.length;
        return rows.filter((r) => evalExpr(e.arg as Expr, r, r.__tables__) != null).length;
      }
      const nums = rows
        .map((r) => evalExpr(e.arg as Expr, r, r.__tables__))
        .filter((v) => v != null)
        .map((v) => Number(v));
      if (e.fn === "sum") return nums.reduce((a, b) => a + b, 0);
      if (e.fn === "avg") return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      if (e.fn === "min") return nums.length ? Math.min(...nums) : null;
      return nums.length ? Math.max(...nums) : null;
    }
  }
}

function compare(a: unknown, b: unknown): number {
  if (a == null) return -1;
  if (b == null) return 1;
  const na = Number(a); const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a).toLowerCase() < String(b).toLowerCase() ? -1 : String(a).toLowerCase() > String(b).toLowerCase() ? 1 : 0;
}
function truthy(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v.toLowerCase() === "true" ? true : v.toLowerCase() === "false" ? false : Boolean(v);
  return Boolean(v);
}

/** Build joined dataset. */
function buildJoin(base: Table, baseName: string, db: Database, join: JoinClause): { rows: (Row & { __tables__: string[] })[] } {
  const right = findTable(db, join.table);
  const rightName = join.table.alias ?? join.table.name;
  const rows: (Row & { __tables__: string[] })[] = [];

  const getVal = (row: Row, tables: string[], col: string, side: "l" | "r"): unknown => {
    // try qualified with this side's alias first, then bare
    const candidates = col.includes(".")
      ? [col]
      : [`${side === "l" ? baseName : rightName}.${col}`, col];
    for (const c of candidates) {
      try { return evalExpr({ kind: "col", name: c }, row, tables); } catch { /* keep trying */ }
    }
    throw new SqlError("ER_BAD_COLUMN", `Kolom \`${col}\` nggak ketemu untuk JOIN. Coba tulis lengkap, misalnya \`${side === "l" ? baseName : rightName}.${col}\`.`);
  };

  let matchedRight = false;
  for (const lr of base.rows) {
    matchedRight = false;
    for (const rr of right.rows) {
      const merged: Row = {};
      for (const k of base.columns) merged[`${baseName}.${k}`] = lr[k];
      for (const k of right.columns) {
        const qk = `${rightName}.${k}`;
        merged[qk] = rr[k];
        if (!(k in merged) || merged[k] === undefined) merged[k] = rr[k];
      }
      // also expose unqualified base columns when not conflicting
      for (const k of base.columns) if (!(k in merged)) merged[k] = lr[k];
      const lv = getVal(merged, [], join.onLeft, "l");
      const rv = getVal(merged, [], join.onRight, "r");
      if (looseEquals(lv, rv)) {
        matchedRight = true;
        rows.push({ ...merged, __tables__: [baseName, rightName] });
      }
    }
    if (!matchedRight && join.type === "left") {
      const merged: Row = {};
      for (const k of base.columns) merged[`${baseName}.${k}`] = lr[k];
      for (const k of base.columns) if (!(k in merged)) merged[k] = lr[k];
      for (const k of right.columns) merged[`${rightName}.${k}`] = null;
      rows.push({ ...merged, __tables__: [baseName, rightName] });
    }
  }
  return { rows };
}

export interface RunResult {
  kind: "select" | "mutation";
  columns: string[];
  rows: Record<string, unknown>[];
  affectedRows?: number;
  message: string;
}

function cloneDb(db: Database): Database {
  const out: Database = {};
  for (const [name, t] of Object.entries(db)) {
    out[name] = { name: t.name, columns: [...t.columns], rows: t.rows.map((r) => ({ ...r })) };
  }
  return out;
}

export function runSql(sql: string, sourceDb: Database): RunResult {
  const trimmed = sql.trim().replace(/;\s*$/, "");
  if (!trimmed) throw new SqlError("ER_EMPTY", "Query-nya masih kosong nih. Tulis sesuatu dulu dong. 😄");
  const stmt = new Parser(tokenize(trimmed)).parseStatement();

  if (stmt.type !== "select") {
    const db = cloneDb(sourceDb);
    const table = db[Object.keys(db).find((k) => k.toLowerCase() === stmt.table.toLowerCase()) ?? ""];
    if (!table)
      throw new SqlError("ER_NO_TABLE", `Tabel \`${stmt.table}\` nggak ada di database ini.`);

    if (stmt.type === "insert") {
      const cols = stmt.columns ?? table.columns;
      for (const c of cols) {
        if (!table.columns.includes(c))
          throw new SqlError("ER_BAD_COLUMN", `Kolom \`${c}\` nggak ada di tabel \`${table.name}\`.`, `Kolom tabel ${table.name}: ${table.columns.join(", ")}`);
      }
      for (const vals of stmt.values) {
        if (vals.length !== cols.length)
          throw new SqlError("ER_VALUES", `Jumlah nilai (${vals.length}) nggak sama dengan jumlah kolom (${cols.length}).`);
        const row: Row = {};
        for (const c of table.columns) row[c] = null;
        cols.forEach((c, idx) => (row[c] = vals[idx]));
        table.rows.push(row);
      }
      return { kind: "mutation", columns: [], rows: [], affectedRows: stmt.values.length, message: `${stmt.values.length} baris berhasil ditambahkan ke ${table.name}. 🎉` };
    }

    const matching = stmt.where ? table.rows.filter((r) => truthy(evalExpr(stmt.where!, r, [table.name]))) : table.rows;

    if (stmt.type === "update") {
      for (const row of matching) {
        for (const set of stmt.sets) {
          if (!table.columns.includes(set.col))
            throw new SqlError("ER_BAD_COLUMN", `Kolom \`${set.col}\` nggak ada di tabel \`${table.name}\`.`);
          row[set.col] = evalExpr(set.value, row, [table.name]);
        }
      }
      return { kind: "mutation", columns: [], rows: [], affectedRows: matching.length, message: `${matching.length} baris di tabel ${table.name} berhasil di-update. ✅` };
    }

    // delete
    table.rows = table.rows.filter((r) => !matching.includes(r));
    return { kind: "mutation", columns: [], rows: [], affectedRows: matching.length, message: `${matching.length} baris dihapus dari ${table.name}. 🗑️` };
  }

  // SELECT
  const base = findTable(sourceDb, stmt.from);
  const baseName = stmt.from.alias ?? stmt.from.name;
  let rows: (Row & { __tables__: string[] })[];
  let availableCols: string[];

  if (stmt.join) {
    const built = buildJoin(base, baseName, sourceDb, stmt.join);
    rows = built.rows;
    const rightName = stmt.join.table.alias ?? stmt.join.table.name;
    const right = findTable(sourceDb, stmt.join.table);
    availableCols = [
      ...base.columns.map((c) => `${baseName}.${c}`),
      ...base.columns.filter((c) => !(right.columns.includes(c))).map((c) => c),
      ...right.columns.map((c) => `${rightName}.${c}`),
    ];
  } else {
    rows = base.rows.map((r) => ({ ...r, __tables__: [baseName] }));
    availableCols = [...base.columns.map((c) => `${baseName}.${c}`), ...base.columns];
  }

  if (stmt.where) {
    rows = rows.filter((r) => truthy(evalExpr(stmt.where!, r, r.__tables__)));
  }

  const hasAgg = stmt.items.some((it) => it !== "*" && containsAgg(it.expr));
  const grouped = hasAgg || (stmt.groupBy && stmt.groupBy.length > 0);

  let resultRows: Row[] = [];
  let columns: string[] = [];

  if (grouped) {
    const groups = new Map<string, (Row & { __tables__: string[] })[]>();
    if (stmt.groupBy && stmt.groupBy.length) {
      for (const r of rows) {
        const key = stmt.groupBy.map((g) => String(evalExpr({ kind: "col", name: g }, r, r.__tables__))).join("\u0001");
        const arr = groups.get(key) ?? [];
        arr.push(r);
        groups.set(key, arr);
      }
    } else {
      groups.set("__all__", rows);
    }
    for (const gRows of groups.values()) {
      const rep = gRows[0];
      const out: Row = {};
      for (const item of stmt.items) {
        if (item === "*") continue;
        const label = item.alias ?? exprLabel(item.expr, baseName);
        out[label] = evalExpr(item.expr, rep, rep.__tables__, gRows);
      }
      // allow selecting plain group-by columns alongside aggregates
      if (stmt.groupBy) {
        for (const g of stmt.groupBy) {
          const label = g;
          if (!(label in out)) out[label] = evalExpr({ kind: "col", name: g }, rep, rep.__tables__);
        }
      }
      resultRows.push(out);
    }
    columns = unique(Object.keys(resultRows[0] ?? {}));
  } else {
    const seen = new Set<string>();
    for (const r of rows) {
      const out: Row = {};
      for (const item of stmt.items) {
        if (item === "*") {
          for (const k of Object.keys(r)) {
            if (k === "__tables__") continue;
            const short = k.includes(".") && !availableCols.includes(k) ? k.split(".").pop()! : k;
            const label = short.includes(".") ? short.split(".").pop()! : short;
            out[label] = r[k];
          }
          continue;
        }
        const label = item.alias ?? exprLabel(item.expr, baseName);
        out[label] = evalExpr(item.expr, r, r.__tables__);
      }
      const sig = JSON.stringify(orderKeys(out));
      if (stmt.distinct && seen.has(sig)) continue;
      seen.add(sig);
      resultRows.push(out);
    }
    columns = unique(resultRows.flatMap((r) => Object.keys(r)));
  }

  if (stmt.orderBy && stmt.orderBy.length) {
    resultRows.sort((a, b) => {
      for (const o of stmt.orderBy!) {
        const av = pickLoose(a, o.col);
        const bv = pickLoose(b, o.col);
        const c = compare(av, bv);
        if (c !== 0) return o.dir === "desc" ? -c : c;
      }
      return 0;
    });
  }

  if (stmt.limit != null) resultRows = resultRows.slice(0, stmt.limit);

  // strip __tables__
  const clean = resultRows.map((r) => {
    const { __tables__, ...rest } = r as Row & { __tables__?: string[] };
    return rest;
  });

  return {
    kind: "select",
    columns: clean.length ? unique(clean.flatMap((r) => Object.keys(r))) : columns,
    rows: clean,
    message: `${clean.length} baris ditemukan.`,
  };
}

function pickLoose(row: Row, col: string): unknown {
  if (col in row) return row[col];
  const lower = col.toLowerCase();
  const k = Object.keys(row).find((key) => key.toLowerCase() === lower || key.toLowerCase().endsWith(`.${lower}`));
  return k ? row[k] : undefined;
}

function orderKeys(obj: Row): Row {
  const out: Row = {};
  for (const k of Object.keys(obj).sort()) out[k] = obj[k];
  return out;
}
function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}
function containsAgg(e: Expr): boolean {
  switch (e.kind) {
    case "agg": return true;
    case "and": case "or": return containsAgg(e.l) || containsAgg(e.r);
    case "not": return containsAgg(e.e);
    case "cmp": return containsAgg(e.l) || containsAgg(e.r);
    default: return false;
  }
}
function exprLabel(e: Expr, baseName: string): string {
  switch (e.kind) {
    case "col": return e.name.includes(".") ? e.name.split(".").slice(1).join(".") : e.name;
    case "agg":
      if (e.arg.kind === "star") return `${e.fn}(*)`;
      return `${e.fn}(${exprLabel(e.arg as Expr, baseName)})`;
    default: return "?column?";
  }
}

/** Compare user's select result to expected result (order-insensitive unless both sorted). */
export function resultsMatch(a: RunResult, b: RunResult, orderMatters: boolean): boolean {
  if (a.kind !== "select" || b.kind !== "select") return a.message === b.message;
  const norm = (rows: Record<string, unknown>[]) =>
    rows.map((r) => {
      const out: Row = {};
      for (const [k, v] of Object.entries(r)) {
        const key = k.includes(".") ? k.split(".").pop()!.toLowerCase() : k.toLowerCase();
        out[key] = v == null ? null : typeof v === "number" ? Math.round(v * 1000) / 1000 : String(v).toLowerCase();
      }
      return out;
    });
  let ra = norm(a.rows);
  let rb = norm(b.rows);
  if (!orderMatters) {
    ra = [...ra].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)));
    rb = [...rb].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)));
  }
  if (ra.length !== rb.length) return false;
  const keysA = Object.keys(ra[0] ?? {}).sort().join(",");
  for (let i = 0; i < ra.length; i++) {
    if (Object.keys(ra[i]).sort().join(",") !== keysA) return false;
    // compare ignoring column names order: use sorted-key signature per row
    const sa = Object.entries(ra[i]).sort(([k1], [k2]) => k1.localeCompare(k2)).map(([, v]) => String(v));
    const sb = Object.entries(rb[i]).sort(([k1], [k2]) => k1.localeCompare(k2)).map(([, v]) => String(v));
    if (sa.join("|") !== sb.join("|")) return false;
  }
  return true;
}