// Envio para o Google Drive direto do navegador (Google Identity Services + Drive API v3).
// Escopo drive.file: o app só enxerga e altera os arquivos e pastas que ele mesmo criou.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const PASTA_PADRAO = "Planos de Aprendizagem";
const API = "https://www.googleapis.com/drive/v3";
const UP = "https://www.googleapis.com/upload/drive/v3";
export const MIME = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  gdoc: "application/vnd.google-apps.document",
  pasta: "application/vnd.google-apps.folder"
};

export const driveConfigurado = !!CLIENT_ID;
let token = null, expira = 0, gis = null;

function carregarGis() {
  if (gis) return gis;
  gis = new Promise((res, rej) => {
    if (window.google?.accounts?.oauth2) return res();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => res();
    s.onerror = () => { gis = null; rej(new Error("Não foi possível carregar o login do Google.")); };
    document.head.appendChild(s);
  });
  return gis;
}

// Deve ser chamado a partir de um clique (o Google abre uma janela de login/consentimento).
export async function obterToken() {
  if (token && Date.now() < expira - 60000) return token;
  await carregarGis();
  return new Promise((res, rej) => {
    const cliente = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error) return rej(new Error(r.error === "access_denied" ? "Acesso ao Google Drive não autorizado." : r.error));
        token = r.access_token; expira = Date.now() + (r.expires_in || 3600) * 1000; res(token);
      },
      error_callback: (e) => rej(new Error(e?.type === "popup_closed" ? "A janela do Google foi fechada." : "Falha no login do Google."))
    });
    cliente.requestAccessToken({ prompt: token ? "" : "consent" });
  });
}

export function sairDrive() {
  if (token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(token, () => {});
  token = null; expira = 0;
}

async function api(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
  if (r.status === 401) { token = null; throw new Error("Sessão do Google expirada. Tente novamente."); }
  if (!r.ok) { let m = r.statusText; try { m = (await r.json()).error?.message || m; } catch {} throw new Error(`Google Drive: ${m}`); }
  return r;
}
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

async function buscar(q) {
  const r = await api(`${API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&spaces=drive&pageSize=10`);
  return (await r.json()).files || [];
}

export async function garantirPasta(nome = PASTA_PADRAO) {
  const chave = "drive-pasta:" + nome;
  const salvo = localStorage.getItem(chave);
  if (salvo) {
    try { const r = await api(`${API}/files/${salvo}?fields=id,trashed`); const j = await r.json(); if (!j.trashed) return salvo; } catch {}
  }
  const achadas = await buscar(`name='${esc(nome)}' and mimeType='${MIME.pasta}' and trashed=false`);
  let id = achadas[0]?.id;
  if (!id) {
    const r = await api(`${API}/files?fields=id`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nome, mimeType: MIME.pasta }) });
    id = (await r.json()).id;
  }
  try { localStorage.setItem(chave, id); } catch {}
  return id;
}

// Cria ou substitui (mesmo nome, mesma pasta, mesmo tipo) um arquivo. destinoMime converte no upload (ex.: docx → Google Docs).
async function enviar({ nome, blob, origemMime, destinoMime, pasta, substituir = true }) {
  const tipoFinal = destinoMime || origemMime;
  const existente = substituir ? (await buscar(`name='${esc(nome)}' and '${pasta}' in parents and mimeType='${tipoFinal}' and trashed=false`))[0] : null;
  const meta = existente ? { name: nome } : { name: nome, parents: [pasta], ...(destinoMime ? { mimeType: destinoMime } : {}) };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
  form.append("file", new Blob([blob], { type: origemMime }));
  const url = existente
    ? `${UP}/files/${existente.id}?uploadType=multipart&fields=id,name,webViewLink`
    : `${UP}/files?uploadType=multipart&fields=id,name,webViewLink`;
  const r = await api(url, { method: existente ? "PATCH" : "POST", body: form });
  return { ...(await r.json()), substituido: !!existente };
}

/**
 * Salva o plano no Drive.
 * formato: "docx" (arquivo Word), "gdoc" (convertido para Google Docs) ou "pdf"
 * (o Drive converte o .docx num Google Doc temporário e exporta em PDF; o temporário é apagado).
 */
export async function salvarNoDrive({ formato, docxBlob, nomeBase, pastaNome }) {
  await obterToken();
  const pasta = await garantirPasta(pastaNome || PASTA_PADRAO);
  if (formato === "docx") return enviar({ nome: nomeBase + ".docx", blob: docxBlob, origemMime: MIME.docx, pasta });
  if (formato === "gdoc") return enviar({ nome: nomeBase, blob: docxBlob, origemMime: MIME.docx, destinoMime: MIME.gdoc, pasta });
  if (formato === "pdf") {
    const tmp = await enviar({ nome: `${nomeBase} (temporário)`, blob: docxBlob, origemMime: MIME.docx, destinoMime: MIME.gdoc, pasta, substituir: false });
    try {
      const pdf = await (await api(`${API}/files/${tmp.id}/export?mimeType=${encodeURIComponent(MIME.pdf)}`)).blob();
      return await enviar({ nome: nomeBase + ".pdf", blob: pdf, origemMime: MIME.pdf, pasta });
    } finally {
      try { await api(`${API}/files/${tmp.id}`, { method: "DELETE" }); } catch {}
    }
  }
  throw new Error("Formato desconhecido.");
}
