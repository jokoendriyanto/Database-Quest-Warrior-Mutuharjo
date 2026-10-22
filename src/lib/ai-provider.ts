/**
 * Klien LLM OpenAI-compatible (PRD 8.6) untuk AI Mentor dan tes koneksi guru.
 * Satu implementasi untuk semua provider: POST {base_url}/chat/completions,
 * GET {base_url}/models.
 *
 * Helper murni — hanya dipakai dari file "use node" (butuh fetch + abort
 * timeout). Tidak boleh di-import dari query/mutation runtime default.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatParams {
  temperature: number; // default 0.3
  maxTokens: number; // default 200
  timeoutMs: number; // default 15_000
}

export const DEFAULT_CHAT_PARAMS: ChatParams = {
  temperature: 0.3,
  maxTokens: 200,
  timeoutMs: 15_000,
};

export type ProviderErrorKind =
  | "unauthorized"
  | "model_not_found"
  | "timeout"
  | "unreachable"
  | "unknown";

export class ProviderError extends Error {
  kind: ProviderErrorKind;
  detail: string;
  constructor(kind: ProviderErrorKind, detail: string) {
    // `message` memuat teks yang bisa dibaca guru (9.5), bukan nama kind.
    super(detail.slice(0, 500));
    this.kind = kind;
    this.detail = detail.slice(0, 500);
  }
}

/** Pesan ramah untuk guru (PRD 9.5) — actionable, Bahasa Indonesia. */
export function friendlyProviderMessage(kind: ProviderErrorKind): string {
  switch (kind) {
    case "unauthorized":
      return "API key ditolak provider. Cek lagi key-nya.";
    case "model_not_found":
      return "Model tidak ditemukan di provider ini. Coba tombol Ambil daftar model.";
    case "timeout":
      return "Provider tidak merespons dalam batas waktu. Coba naikkan timeout atau cek base URL.";
    case "unreachable":
      return "Base URL tidak bisa dijangkau. Cek lagi alamatnya dan pastikan jaringan sekolah mengizinkan.";
    default:
      return "Provider merespons dengan cara yang tidak terduga. Coba lagi atau ganti model.";
  }
}

/** Trim + buang trailing slash — endpoint selalu {base}/chat/completions. */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Validasi base URL (PRD 9.2 & 10.1): harus URL valid ber-scheme http/https.
 * HTTPS wajib, kecuali host lokal (localhost / 127.0.0.1 / ::1 / *.local)
 * untuk Ollama / LM Studio.
 */
export function validateBaseUrl(raw: string): string {
  const url = normalizeBaseUrl(raw);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ProviderError("unknown", "Base URL bukan URL yang valid.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ProviderError("unknown", "Base URL harus memakai http atau https.");
  }
  const host = parsed.hostname;
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local");
  if (parsed.protocol === "http:" && !isLocal) {
    throw new ProviderError(
      "unknown",
      "Base URL non-lokal wajib memakai https. Untuk Ollama/LM Studio lokal, host harus localhost.",
    );
  }
  return url;
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

export interface ChatResult {
  text: string;
  tokensUsed: number | null;
  latencyMs: number;
}

/** POST {base}/chat/completions — dipakai AI Mentor & tes koneksi. */
export async function chatComplete(opts: {
  baseUrl: string;
  apiKey: string | null; // null untuk provider lokal tanpa key
  model: string;
  messages: ChatMessage[];
  params: ChatParams;
}): Promise<ChatResult> {
  const base = normalizeBaseUrl(opts.baseUrl);
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.params.temperature,
        max_tokens: opts.params.maxTokens,
      }),
      signal: AbortSignal.timeout(opts.params.timeoutMs),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/timeout|abort/i.test(msg)) {
      throw new ProviderError("timeout", `Tidak ada respons dalam ${opts.params.timeoutMs} ms.`);
    }
    throw new ProviderError("unreachable", msg);
  }
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 500);
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("unauthorized", `HTTP ${res.status}. ${body}`);
    }
    if (res.status === 404 || res.status === 400) {
      // 400/404 sering berarti model tidak dikenal (atau path salah).
      throw new ProviderError("model_not_found", `HTTP ${res.status}. ${body}`);
    }
    throw new ProviderError("unknown", `HTTP ${res.status}. ${body}`);
  }

  let data: ChatResponse;
  try {
    data = (await res.json()) as ChatResponse;
  } catch {
    throw new ProviderError("unknown", "Respons provider bukan JSON yang valid.");
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new ProviderError("unknown", "Respons provider tidak memuat jawaban (choices kosong).");
  }
  return {
    text,
    tokensUsed: data.usage?.total_tokens ?? null,
    latencyMs,
  };
}

/** GET {base}/models — tombol "Ambil daftar model" di form guru. */
export async function listModels(opts: {
  baseUrl: string;
  apiKey: string | null;
  timeoutMs?: number;
}): Promise<string[]> {
  const base = normalizeBaseUrl(opts.baseUrl);
  let res: Response;
  try {
    res = await fetch(`${base}/models`, {
      method: "GET",
      headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {},
      signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/timeout|abort/i.test(msg)) {
      throw new ProviderError("timeout", msg);
    }
    throw new ProviderError("unreachable", msg);
  }
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 500);
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("unauthorized", `HTTP ${res.status}. ${body}`);
    }
    throw new ProviderError("unknown", `HTTP ${res.status}. ${body}`);
  }
  let data: { data?: { id?: string }[] };
  try {
    data = (await res.json()) as { data?: { id?: string }[] };
  } catch {
    throw new ProviderError("unknown", "Respons provider bukan JSON yang valid.");
  }
  const models = (data.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (models.length === 0) {
    throw new ProviderError("unknown", "Daftar model kosong atau format tidak didukung provider ini.");
  }
  return models.sort();
}

/* ------------------------- never-rules filter --------------------------- */

/**
 * Pola yang dilarang muncul di output AI (PRD 8.4):
 * 1. Query SELECT/DML penuh yang menjawab case.
 * 2. Pasangan kolom = nilai yang merupakan jawaban (ON/WHERE).
 * 3. Frasa "jawabannya adalah", "query yang benar:", "coba jalankan ini:".
 */
const NEVER_RULES: RegExp[] = [
  // 1a. SELECT penuh dengan klausa lanjutan (WHERE/GROUP BY/ORDER BY/LIMIT/JOIN)
  /\bselect\b[\s\S]{0,300}?\bfrom\b[\s\S]{0,300}?\b(where|group\s+by|order\s+by|limit|join|inner|left|right)\b/i,
  // 1b. SELECT agregat tanpa klausa lanjutan (tetap query solusi)
  /\bselect\s+(count|sum|avg|min|max)\s*\(/i,
  // 1c. DML yang menyelesaikan/mengubah kasus
  /\b(insert\s+into|update\s+\w+\s+set|delete\s+from)\b/i,
  // 1d. Subquery solusi dengan klausa lanjutan
  /\bin\s*\(\s*select\b[\s\S]{0,200}?\b(group\s+by|where|having|order\s+by)\b/i,
  // 2a. Kolom = kolom (kondisi join/penggabungan)
  /\b[\w.]+\s*=\s*[\w.]+\b/,
  // 2b. kolom = nilai literal ('...', angka, atau tanda $)
  /\b[\w.]+\s*=\s*('[^']+'|\d+|\$[\w.]+)/,
  // 2c. BETWEEN rentang tanggal/angka (pasangan nilai jawaban)
  /\bbetween\s+'[^']+'\s+and\s+'[^']+'/i,
  // 3. frasa larangan eksplisit
  /\bjawabannya\s+adalah\b/i,
  /\bquery\s+yang\s+benar\b/i,
  /\bcoba\s+jalankan\s+ini\b/i,
  /\bkunci\s+jawaban\b/i,
  /--\s*contoh\s+jawaban/i,
];

/**
 * Post-filter keluaran AI: buang em dash (PRD 10.3) dan deteksi kebocoran
 * solusi. Mengembalikan null jika output melanggar never-rules (pemanggil
 * wajib menolak hint tersebut dan TIDAK menghitungnya terpakai).
 */
export function postFilterOutput(text: string): string | null {
  const cleaned = text.replace(/—/g, "-").trim();
  for (const re of NEVER_RULES) {
    if (re.test(cleaned)) return null;
  }
  return cleaned;
}
