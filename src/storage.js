// Armazenamento dos planos numa pasta do computador (File System Access API — Chrome e Edge).
// A pasta escolhida é lembrada entre visitas (IndexedDB); o navegador pode pedir a permissão de novo.

export const suportaPasta = typeof window !== "undefined" && "showDirectoryPicker" in window;

const DB = "plano-editor", STORE = "kv";
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function kv(op, key, val) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, op === "get" ? "readonly" : "readwrite");
    const st = tx.objectStore(STORE);
    const rq = op === "get" ? st.get(key) : op === "del" ? st.delete(key) : st.put(val, key);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}

export async function pastaLembrada() {
  try { return (await kv("get", "pasta")) || null; } catch { return null; }
}

export async function escolherPasta() {
  const h = await window.showDirectoryPicker({ id: "planos", mode: "readwrite" });
  try { await kv("put", "pasta", h); } catch {}
  return h;
}

export async function esquecerPasta() {
  try { await kv("del", "pasta"); } catch {}
}

// true se já há permissão; com pedir=true solicita (precisa vir de um clique).
export async function permissao(h, pedir) {
  const o = { mode: "readwrite" };
  if ((await h.queryPermission(o)) === "granted") return true;
  return pedir ? (await h.requestPermission(o)) === "granted" : false;
}

export async function listarPlanos(h) {
  const out = [];
  for await (const [nome, e] of h.entries()) {
    if (e.kind !== "file" || !nome.toLowerCase().endsWith(".json")) continue;
    try {
      const f = await e.getFile();
      let titulo = nome;
      try { const j = JSON.parse(await f.text()); if (j && j.unidades) titulo = j.componente || nome; else continue; } catch { continue; }
      out.push({ nome, titulo, modificado: f.lastModified });
    } catch {}
  }
  return out.sort((a, b) => b.modificado - a.modificado);
}

export async function lerPlano(h, nome) {
  const f = await (await h.getFileHandle(nome)).getFile();
  return JSON.parse(await f.text());
}

export async function existe(h, nome) {
  try { await h.getFileHandle(nome); return true; } catch { return false; }
}

export async function gravar(h, nome, conteudo) {
  const fh = await h.getFileHandle(nome, { create: true });
  const w = await fh.createWritable();
  await w.write(conteudo);
  await w.close();
}

export async function excluir(h, nome) {
  await h.removeEntry(nome);
}

// Alternativa para navegadores sem acesso a pastas: baixar e importar arquivos.
export function baixar(blob, nome) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
