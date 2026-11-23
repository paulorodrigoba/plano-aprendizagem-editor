import { useEffect, useMemo, useRef, useState } from "react";
import {
  novoPlano, normalizar, validar, nomeArquivo, numeroObjeto, temaAula,
  ROMANOS, N_AULAS, AULAS_FIXAS, AULA_REV_N1, AULA_REV_N2, ASPECTO_LEGAL, AVALIACAO_FIXA
} from "./model.js";
import * as fs from "./storage.js";
import Documento from "./Documento.jsx";
import { driveConfigurado } from "./drive.js";

const SECOES = [
  ["identificacao", "Identificação"], ["ementa", "Ementa"], ["objetivos", "Objetivos"], ["habilidades", "Habilidades e competências"],
  ["unidades", "Unidades e objetos"], ["egresso", "Perfil do egresso"], ["bibliografia", "Bibliografia e materiais"],
  ["articulacao", "Articulações"], ["transversal", "Atividade transversal"], ["extensao", "Atividade de extensão"],
  ["metodologia", "Metodologia"], ["avaliacao", "Avaliação"], ["aulas", "Plano de aula"], ["praticas", "Atividades práticas"],
  ["responsaveis", "Responsáveis"]
];
const RASCUNHO = "plano-editor-rascunho";

function Campo({ rotulo, dica, valor, onChange, linhas = 0, ...rest }) {
  return (
    <label className="campo">
      <span>{rotulo}{dica && <small>{dica}</small>}</span>
      {linhas ? <textarea rows={linhas} value={valor} onChange={(e) => onChange(e.target.value)} {...rest} />
        : <input value={valor} onChange={(e) => onChange(e.target.value)} {...rest} />}
    </label>
  );
}

export default function App() {
  const [P, setP] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem(RASCUNHO) || "null"); if (r?.plano) return normalizar(r.plano); } catch {}
    return novoPlano();
  });
  const [arquivo, setArquivo] = useState(() => { try { return JSON.parse(localStorage.getItem(RASCUNHO) || "null")?.arquivo || null; } catch { return null; } });
  const [sujo, setSujo] = useState(false);
  const [secao, setSecao] = useState("identificacao");
  const [modo, setModo] = useState("editar");
  const [pasta, setPasta] = useState(null);
  const [pastaPendente, setPastaPendente] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [msg, setMsg] = useState("");
  const [dialogo, setDialogo] = useState(null);
  const [verPendencias, setVerPendencias] = useState(false);
  const [drive, setDrive] = useState(false);
  const importRef = useRef();

  const pend = useMemo(() => validar(P), [P]);
  const erros = pend.filter((e) => !e.aviso);
  const porSecao = useMemo(() => pend.reduce((m, e) => ({ ...m, [e.sec]: (m[e.sec] || 0) + 1 }), {}), [pend]);

  const aviso = (t) => { setMsg(t); clearTimeout(aviso.t); aviso.t = setTimeout(() => setMsg(""), 4000); };
  const set = (fn) => { setP((p) => { const n = structuredClone(p); fn(n); return n; }); setSujo(true); };

  useEffect(() => { try { localStorage.setItem(RASCUNHO, JSON.stringify({ plano: P, arquivo })); } catch {} }, [P, arquivo]);
  useEffect(() => {
    const f = (e) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", f); return () => window.removeEventListener("beforeunload", f);
  }, [sujo]);
  useEffect(() => {
    if (!fs.suportaPasta) return;
    fs.pastaLembrada().then(async (h) => {
      if (!h) return;
      if (await fs.permissao(h, false)) { setPasta(h); setPlanos(await fs.listarPlanos(h)); } else setPastaPendente(h);
    });
  }, []);
  useEffect(() => {
    const f = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); salvar(); } };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  });

  async function atualizarLista(h = pasta) { if (h) setPlanos(await fs.listarPlanos(h)); }
  async function escolherPasta() {
    try { const h = await fs.escolherPasta(); setPasta(h); setPastaPendente(null); await atualizarLista(h); aviso(`Pasta "${h.name}" conectada.`); return h; }
    catch (e) { if (e.name !== "AbortError") aviso("Não foi possível abrir a pasta."); return null; }
  }
  async function reconectar() {
    if (await fs.permissao(pastaPendente, true)) { setPasta(pastaPendente); setPastaPendente(null); atualizarLista(pastaPendente); }
    else aviso("Permissão negada. Escolha a pasta novamente.");
  }
  const confirmarDescarte = () => !sujo || window.confirm("Há alterações não salvas neste plano. Deseja descartá-las?");

  async function salvar(comoNovo = false) {
    const conteudo = JSON.stringify({ ...P, salvoEm: new Date().toISOString() }, null, 2);
    if (!fs.suportaPasta) { fs.baixar(new Blob([conteudo], { type: "application/json" }), arquivo || nomeArquivo(P, "json")); setSujo(false); aviso("Arquivo .json baixado."); return; }
    let h = pasta;
    if (!h && pastaPendente && (await fs.permissao(pastaPendente, true))) { h = pastaPendente; setPasta(h); setPastaPendente(null); }
    if (!h) h = await escolherPasta();
    if (!h) return;
    let nome = !comoNovo && arquivo ? arquivo : nomeArquivo(P, "json");
    if (comoNovo || !arquivo) {
      const pedido = window.prompt("Nome do arquivo do plano:", nome);
      if (!pedido) return;
      nome = pedido.toLowerCase().endsWith(".json") ? pedido : pedido + ".json";
      if (await fs.existe(h, nome) && !window.confirm(`Já existe "${nome}" nesta pasta. Substituir?`)) return;
    }
    try { await fs.gravar(h, nome, conteudo); setArquivo(nome); setSujo(false); aviso(`Salvo em ${h.name}/${nome}`); atualizarLista(h); }
    catch { aviso("Não foi possível salvar. Verifique a permissão da pasta."); }
  }
  async function abrir(nome) {
    if (!confirmarDescarte()) return;
    try { setP(normalizar(await fs.lerPlano(pasta, nome))); setArquivo(nome); setSujo(false); setSecao("identificacao"); setModo("editar"); aviso(`Aberto: ${nome}`); }
    catch { aviso("Arquivo inválido ou ilegível."); }
  }
  async function excluir(nome) {
    if (!window.confirm(`Excluir "${nome}" da pasta? Esta ação não pode ser desfeita.`)) return;
    try { await fs.excluir(pasta, nome); if (nome === arquivo) setArquivo(null); atualizarLista(); aviso("Arquivo excluído."); } catch { aviso("Não foi possível excluir."); }
  }
  function novo() {
    if (!confirmarDescarte()) return;
    setP(novoPlano()); setArquivo(null); setSujo(false); setSecao("identificacao"); setModo("editar");
  }
  function duplicar() {
    set((n) => { n.componente = n.componente ? n.componente + " (cópia)" : ""; });
    setArquivo(null); aviso("Cópia criada. Salve com um novo nome.");
  }
  async function importar(e) {
    const f = e.target.files[0]; e.target.value = "";
    if (!f || !confirmarDescarte()) return;
    try { setP(normalizar(JSON.parse(await f.text()))); setArquivo(f.name); setSujo(false); aviso(`Importado: ${f.name}`); } catch { aviso("Arquivo inválido."); }
  }

  function exportar(tipo) {
    const go = () => (tipo === "docx" ? exportarDocx() : exportarPdf());
    if (erros.length) setDialogo({ tipo, go }); else go();
  }
  async function exportarDocx() {
    setDialogo(null);
    try {
      const { gerarDocx } = await import("./exportDocx.js");
      const blob = await gerarDocx(P), nome = nomeArquivo(P, "docx");
      if (pasta && window.confirm(`Salvar "${nome}" também na pasta ${pasta.name}?\n(OK = salvar na pasta, Cancelar = só baixar)`)) {
        await fs.gravar(pasta, nome, blob); aviso(`DOCX salvo em ${pasta.name}/${nome}`);
      } else { fs.baixar(blob, nome); aviso("DOCX baixado."); }
    } catch { aviso("Erro ao gerar o .docx."); }
  }
  function exportarPdf() {
    setDialogo(null);
    const t = document.title; document.title = nomeArquivo(P, "pdf").replace(/\.pdf$/, "");
    setTimeout(() => { window.print(); document.title = t; }, 50);
  }

  const u = (fn) => set(fn);
  const titulo = P.componente || "Novo plano";

  return (
    <>
      <div className="app">
        <header className="topo">
          <img src="/logo.png" alt="FAMETRO" />
          <div className="topo-tit">
            <h1>{titulo}</h1>
            <span className={sujo ? "estado sujo" : "estado"}>{arquivo ? arquivo : "não salvo"}{sujo ? " • alterações não salvas" : ""}</span>
          </div>
          <div className="acoes">
            <button onClick={novo}>Novo</button>
            <button onClick={duplicar}>Duplicar</button>
            <button className="pri" onClick={() => salvar()}>Salvar</button>
            {fs.suportaPasta && <button onClick={() => salvar(true)}>Salvar como…</button>}
            <button onClick={() => setModo(modo === "editar" ? "ver" : "editar")}>{modo === "editar" ? "Pré-visualizar" : "Voltar à edição"}</button>
            <button onClick={() => exportar("docx")}>Exportar DOCX</button>
            <button onClick={() => exportar("pdf")}>Exportar PDF</button>
            <button onClick={() => setDrive(true)}>Google Drive</button>
          </div>
        </header>

        <div className="corpo">
          <aside className="lateral">
            <section className="bloco-pasta">
              <h2>Meus planos</h2>
              {fs.suportaPasta ? (
                pasta ? <>
                  <p className="pasta">Pasta: <b>{pasta.name}</b> <button className="link" onClick={escolherPasta}>trocar</button></p>
                  {planos.length ? <ul className="lista">{planos.map((pl) => (
                    <li key={pl.nome} className={pl.nome === arquivo ? "atual" : ""}>
                      <button className="abrir" onClick={() => abrir(pl.nome)} title={pl.nome}>{pl.titulo}<small>{new Date(pl.modificado).toLocaleString("pt-BR")}</small></button>
                      <button className="x" aria-label={`Excluir ${pl.nome}`} onClick={() => excluir(pl.nome)}>×</button>
                    </li>))}</ul> : <p className="vazio">Nenhum plano salvo nesta pasta ainda.</p>}
                </> : pastaPendente ? <button onClick={reconectar}>Reconectar pasta “{pastaPendente.name}”</button>
                  : <button onClick={escolherPasta}>Escolher pasta dos planos</button>
              ) : <>
                <p className="vazio">Este navegador não permite gravar numa pasta. Use Chrome ou Edge, ou trabalhe com arquivos .json:</p>
                <button onClick={() => importRef.current.click()}>Abrir arquivo .json</button>
              </>}
              <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={importar} />
              {fs.suportaPasta && <button className="link" onClick={() => importRef.current.click()}>Importar .json de outro local</button>}
            </section>
            <nav className="nav">
              {SECOES.map(([id, nome]) => (
                <button key={id} className={secao === id && modo === "editar" ? "on" : ""} onClick={() => { setSecao(id); setModo("editar"); }}>
                  {nome}{porSecao[id] ? <span className="badge">{porSecao[id]}</span> : null}
                </button>
              ))}
            </nav>
            <button className={"pend " + (erros.length ? "ruim" : "bom")} onClick={() => setVerPendencias(true)}>
              {erros.length ? `${erros.length} pendência(s)` : "Plano completo"}{pend.length - erros.length ? ` · ${pend.length - erros.length} aviso(s)` : ""}
            </button>
          </aside>

          <main className="principal">
            {msg && <div className="toast" role="status">{msg}</div>}
            {modo === "ver" ? <div className="previa"><Documento P={P} /></div> : (
              <Editor secao={secao} P={P} u={u} />
            )}
          </main>
        </div>
      </div>

      <div className="impressao"><Documento P={P} /></div>

      {dialogo && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="caixa">
            <h2>Há {erros.length} pendência(s) no plano</h2>
            <ul>{erros.slice(0, 12).map((e, i) => <li key={i}>{e.msg}</li>)}{erros.length > 12 && <li>… e mais {erros.length - 12}.</li>}</ul>
            <div className="acoes">
              <button onClick={() => setDialogo(null)}>Voltar e corrigir</button>
              <button className="pri" onClick={dialogo.go}>Exportar mesmo assim</button>
            </div>
          </div>
        </div>
      )}
      {drive && <DialogoDrive P={P} erros={erros} fechar={() => setDrive(false)} />}
      {verPendencias && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setVerPendencias(false)}>
          <div className="caixa">
            <h2>{pend.length ? "Pendências e avisos" : "Nenhuma pendência"}</h2>
            <ul className="pendlista">{pend.map((e, i) => (
              <li key={i} className={e.aviso ? "av" : ""}><button className="link" onClick={() => { setSecao(e.sec); setModo("editar"); setVerPendencias(false); }}>{e.aviso ? "Aviso: " : ""}{e.msg}</button></li>
            ))}</ul>
            <div className="acoes"><button onClick={() => setVerPendencias(false)}>Fechar</button></div>
          </div>
        </div>
      )}
    </>
  );
}

function Editor({ secao, P, u }) {
  // Funções de render (não componentes) para não remontar os campos a cada digitação.
  const grupo = (chave, nomes) => (
    <div className="grid3">{nomes.map(([k, n]) => (
      <Campo key={k} rotulo={n} dica="um item por linha" linhas={7} valor={P[chave][k]} onChange={(v) => u((x) => { x[chave][k] = v; })} />
    ))}</div>
  );
  switch (secao) {
    case "identificacao": return (
      <Sec t="Identificação">
        <div className="grid2">
          <Campo rotulo="Componente curricular" valor={P.componente} onChange={(v) => u((x) => { x.componente = v; })} />
          <Campo rotulo="Curso" valor={P.curso} onChange={(v) => u((x) => { x.curso = v; })} />
          <Campo rotulo="Período" valor={P.periodo} onChange={(v) => u((x) => { x.periodo = v; })} placeholder="8° período" />
          <Campo rotulo="Carga horária" valor={P.carga} onChange={(v) => u((x) => { x.carga = v; })} placeholder="80 horas" />
        </div>
        <Fixo rotulo="Aspecto legal (fixo no template)" texto={ASPECTO_LEGAL} />
      </Sec>);
    case "ementa": return <Sec t="Ementa"><Campo rotulo="Ementa" linhas={10} valor={P.ementa} onChange={(v) => u((x) => { x.ementa = v; })} /></Sec>;
    case "objetivos": return (
      <Sec t="Objetivos de aprendizagem">
        <Campo rotulo="Objetivo geral" linhas={4} valor={P.objetivoGeral} onChange={(v) => u((x) => { x.objetivoGeral = v; })} />
        <h3>Objetivos específicos</h3>
        {grupo("objEsp", [["cognitivos", "Cognitivos"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]])}
      </Sec>);
    case "habilidades": return (
      <Sec t="Habilidades e competências">
        {grupo("habilidades", [["cognitivas", "Cognitivas"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]])}
      </Sec>);
    case "unidades": return (
      <Sec t="Unidades e objetos de conhecimento">
        <div className="grid2 estreito">
          <Campo rotulo="Número do primeiro objeto de conhecimento" dica="a numeração segue sem reiniciar entre as unidades" type="number" min="1"
            valor={P.numeroInicial} onChange={(v) => u((x) => { x.numeroInicial = parseInt(v, 10) || 1; })} />
        </div>
        {P.unidades.map((un, i) => (
          <fieldset key={i} className="unidade">
            <legend>Unidade Didática {ROMANOS[i]}</legend>
            <Campo rotulo="Nome por extenso da unidade" valor={un.nome} onChange={(v) => u((x) => { x.unidades[i].nome = v; })} />
            {un.objetos.map((o, j) => (
              <Campo key={j} rotulo={`Objeto de Conhecimento ${numeroObjeto(P, i * 5 + j)}`} linhas={2} valor={o} onChange={(v) => u((x) => { x.unidades[i].objetos[j] = v; })} />
            ))}
          </fieldset>
        ))}
      </Sec>);
    case "egresso": return <Sec t="Perfil do egresso"><Campo rotulo="Contribuições para o perfil do egresso" linhas={10} valor={P.perfilEgresso} onChange={(v) => u((x) => { x.perfilEgresso = v; })} /></Sec>;
    case "bibliografia": {
      const refs = (k, t) => (<>
        <h3>{t}</h3>
        {P[k].map((r, i) => (
          <fieldset key={i} className="ref">
            <legend>{i + 1}.</legend>
            <Campo rotulo="Autoria" dica="ex.: MARTIN, Robert C." valor={r.autoria} onChange={(v) => u((x) => { x[k][i].autoria = v; })} />
            <Campo rotulo="Título (em negrito)" valor={r.titulo} onChange={(v) => u((x) => { x[k][i].titulo = v; })} />
            <Campo rotulo="Demais elementos" dica="subtítulo, edição, local, editora, ano" valor={r.complemento} onChange={(v) => u((x) => { x[k][i].complemento = v; })} />
            <p className="previa-ref">{r.autoria}<b>{r.titulo}</b>{r.complemento}</p>
          </fieldset>))}
      </>);
      return (
        <Sec t="Bibliografia e materiais">
          <p className="nota">Inclua a pontuação e os espaços como devem aparecer, por exemplo: autoria “MARTIN, Robert C. ”, título “Arquitetura limpa”, demais elementos “: o guia do artesão… Rio de Janeiro: Alta Books, 2019.”</p>
          {refs("bibBasica", "Bibliografia básica (3 obras)")}
          {refs("bibComplementar", "Bibliografia complementar (5 obras)")}
          <Campo rotulo="Materiais de apoio, atualidade e inovações" dica="um item por linha" linhas={7} valor={P.materiais} onChange={(v) => u((x) => { x.materiais = v; })} />
        </Sec>);
    }
    case "articulacao": return <Sec t="Articulações com outras unidades curriculares"><Campo rotulo="Texto" linhas={10} valor={P.articulacao} onChange={(v) => u((x) => { x.articulacao = v; })} /></Sec>;
    case "transversal": return (
      <Sec t="Atividade transversal">
        <p className="nota">Preenchido com o texto do template do NDE. Edite apenas se a coordenação orientar.</p>
        <Campo rotulo="Aspecto legal" linhas={10} valor={P.transversal.aspectoLegal} onChange={(v) => u((x) => { x.transversal.aspectoLegal = v; })} />
        <Campo rotulo="Metodologia" linhas={10} valor={P.transversal.metodologia} onChange={(v) => u((x) => { x.transversal.metodologia = v; })} />
      </Sec>);
    case "extensao": return (
      <Sec t="Atividade de extensão">
        <label className="check"><input type="checkbox" checked={P.incluirExtensao} onChange={(e) => u((x) => { x.incluirExtensao = e.target.checked; })} /> Incluir as seções de extensão no documento</label>
        <p className="nota">Preenchido com o texto do template do NDE. Desmarque para disciplinas que não têm carga horária de extensão no PPC.</p>
        {P.incluirExtensao && <>
          <Campo rotulo="Aspecto legal" linhas={10} valor={P.extensao.aspectoLegal} onChange={(v) => u((x) => { x.extensao.aspectoLegal = v; })} />
          <Campo rotulo="Metodologia" linhas={10} valor={P.extensao.metodologia} onChange={(v) => u((x) => { x.extensao.metodologia = v; })} />
          <Campo rotulo="Título do projeto" linhas={2} valor={P.extensao.titulo} onChange={(v) => u((x) => { x.extensao.titulo = v; })} />
          <Campo rotulo="Disciplinas com carga horária de extensão" dica="uma por linha" linhas={8} valor={P.extensao.disciplinas} onChange={(v) => u((x) => { x.extensao.disciplinas = v; })} />
        </>}
      </Sec>);
    case "metodologia": return <Sec t="Metodologia"><Campo rotulo="Texto" linhas={10} valor={P.metodologia} onChange={(v) => u((x) => { x.metodologia = v; })} /></Sec>;
    case "avaliacao": return (
      <Sec t="Avaliação">
        <p className="nota">Texto institucional fixo do template, reproduzido sem alterações no documento.</p>
        <div className="fixo">{AVALIACAO_FIXA.map((x, i) => <p key={i}>{x.b && <b>{x.b}</b>}{x.t}</p>)}</div>
      </Sec>);
    case "aulas": return <Aulas P={P} u={u} />;
    case "praticas": return (
      <Sec t="Atividades práticas">
        {P.atividadesPraticas.map((a, i) => (
          <fieldset key={i} className="unidade">
            <legend>Atividade Prática {i + 1}</legend>
            <Campo rotulo="Tema de estudo" linhas={2} valor={a.tema} onChange={(v) => u((x) => { x.atividadesPraticas[i].tema = v; })} />
            <Campo rotulo="Objetivos de aprendizagem" linhas={3} valor={a.objetivos} onChange={(v) => u((x) => { x.atividadesPraticas[i].objetivos = v; })} />
            <Campo rotulo="Processo cognitivo/operação mental" linhas={2} valor={a.processo} onChange={(v) => u((x) => { x.atividadesPraticas[i].processo = v; })} />
            <Campo rotulo="Descrição da atividade" linhas={6} valor={a.descricao} onChange={(v) => u((x) => { x.atividadesPraticas[i].descricao = v; })} />
          </fieldset>))}
      </Sec>);
    case "responsaveis": return (
      <Sec t="Responsáveis pelas informações">
        <div className="grid2">
          <Campo rotulo="Professor(a)" valor={P.professor} onChange={(v) => u((x) => { x.professor = v; })} />
          <Campo rotulo="Data (professor)" valor={P.dataProfessor} placeholder="dd/mm/aaaa" onChange={(v) => u((x) => { x.dataProfessor = v; })} />
          <Campo rotulo="Coordenador(a)/NDE" valor={P.coordenador} onChange={(v) => u((x) => { x.coordenador = v; })} />
          <Campo rotulo="Data (coordenação)" valor={P.dataCoordenador} placeholder="dd/mm/aaaa" onChange={(v) => u((x) => { x.dataCoordenador = v; })} />
        </div>
      </Sec>);
    default: return null;
  }
}

function Aulas({ P, u }) {
  const [aberta, setAberta] = useState(1);
  return (
    <Sec t="Plano de aula — 22 encontros">
      <p className="nota">Aulas 1 a 8: Unidades I e II (Aula 8 = revisão para a N1). Aula 9: N1. Aulas 10 a 21: Unidades III a VI (Aula 21 = revisão para a N2). Aula 22: N2. O campo Unidade/Tema é montado a partir dos objetos marcados.</p>
      <div className="aulas-nav">{Array.from({ length: N_AULAS }, (_, k) => {
        const n = k + 1, fixa = AULAS_FIXAS[n], a = P.aulas[k];
        const ok = fixa || (a.objetivos.trim() && a.objetos.length && a.estrategia.trim() && a.avaliacao.trim());
        return <button key={n} className={(aberta === n ? "on " : "") + (fixa ? "fixa" : ok ? "ok" : "")} onClick={() => setAberta(n)}>{n}</button>;
      })}</div>
      <AulaEditor key={aberta} n={aberta} P={P} u={u} />
      <div className="aulas-pass">
        <button disabled={aberta === 1} onClick={() => setAberta(aberta - 1)}>← Aula anterior</button>
        <button disabled={aberta === N_AULAS} onClick={() => setAberta(aberta + 1)}>Próxima aula →</button>
      </div>
    </Sec>
  );
}

function AulaEditor({ n, P, u }) {
  const fixa = AULAS_FIXAS[n];
  if (fixa) return (
    <div className="aula">
      <h3>Aula {n} — Avaliação Institucional {n === 9 ? "N1" : "N2"}</h3>
      <p className="nota">Aula bloqueada: preenchida automaticamente conforme a composição das notas.</p>
      <dl className="fixo"><dt>Objetivos</dt><dd>{fixa.objetivos}</dd><dt>Unidade/Tema</dt><dd>{fixa.tema}</dd><dt>Estratégia</dt><dd>{fixa.estrategia}</dd><dt>Avaliação formativa</dt><dd>{fixa.avaliacao}</dd></dl>
    </div>);
  const a = P.aulas[n - 1];
  const revisao = n === AULA_REV_N1 ? "Revisão das Unidades I e II (preparação para a N1)" : n === AULA_REV_N2 ? "Revisão das Unidades V e VI (preparação para a N2)" : null;
  const permitidas = n < 9 ? [0, 1] : [2, 3, 4, 5];
  const toggle = (idx) => u((x) => { const s = new Set(x.aulas[n - 1].objetos); s.has(idx) ? s.delete(idx) : s.add(idx); x.aulas[n - 1].objetos = [...s].sort((p, q) => p - q); });
  const tema = temaAula(P, n);
  return (
    <div className="aula">
      <h3>Aula {n}{revisao && <span className="tag">{revisao}</span>}</h3>
      <Campo rotulo="Objetivos de aprendizagem" linhas={3} valor={a.objetivos} onChange={(v) => u((x) => { x.aulas[n - 1].objetivos = v; })} />
      <div className="campo"><span>Objetos de conhecimento tratados na aula</span>
        <div className="objs">{P.unidades.map((un, i) => (
          <div key={i} className={"obj-un" + (permitidas.includes(i) ? "" : " fora")}>
            <b>Unidade {ROMANOS[i]}{un.nome ? ` — ${un.nome}` : ""}</b>
            {un.objetos.map((o, j) => { const idx = i * 5 + j; return (
              <label key={j} className="check"><input type="checkbox" checked={a.objetos.includes(idx)} onChange={() => toggle(idx)} />
                <span><b>{numeroObjeto(P, idx)}</b> {o || <i>(sem descrição)</i>}</span></label>); })}
          </div>))}
        </div>
      </div>
      <div className="tema"><small>Unidade/Tema de estudo (gerado)</small>{tema.length ? tema.map((l, i) => <p key={i}>{/^UNIDADE/.test(l) ? <b>{l}</b> : l}</p>) : <p className="vazio">Marque ao menos um objeto.</p>}</div>
      <div className="grid2">
        <Campo rotulo="Estratégia de ensino/aprendizagem" linhas={4} valor={a.estrategia} onChange={(v) => u((x) => { x.aulas[n - 1].estrategia = v; })} />
        <Campo rotulo="Avaliação formativa" linhas={4} valor={a.avaliacao} onChange={(v) => u((x) => { x.aulas[n - 1].avaliacao = v; })} />
      </div>
    </div>
  );
}

const Sec = ({ t, children }) => <section className="sec"><h2>{t}</h2>{children}</section>;
const Fixo = ({ rotulo, texto }) => <div className="campo"><span>{rotulo}</span><div className="fixo"><p>{texto}</p></div></div>;

const FORMATOS = [["docx", "Word (.docx)"], ["gdoc", "Google Docs (editável no Drive)"], ["pdf", "PDF"]];

function DialogoDrive({ P, erros, fechar }) {
  const [sel, setSel] = useState(() => { try { return JSON.parse(localStorage.getItem("drive-formatos")) || ["docx", "pdf"]; } catch { return ["docx", "pdf"]; } });
  const [pasta, setPasta] = useState(() => localStorage.getItem("drive-pasta-nome") || "Planos de Aprendizagem");
  const [res, setRes] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const alterna = (f) => setSel((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  async function enviar() {
    try { localStorage.setItem("drive-formatos", JSON.stringify(sel)); localStorage.setItem("drive-pasta-nome", pasta); } catch {}
    setOcupado(true); setRes({});
    try {
      const [{ gerarDocx }, { salvarNoDrive, obterToken }] = await Promise.all([import("./exportDocx.js"), import("./drive.js")]);
      await obterToken();
      const docxBlob = await gerarDocx(P);
      const nomeBase = nomeArquivo(P, "docx").replace(/\.docx$/, "");
      for (const f of FORMATOS.map(([k]) => k).filter((k) => sel.includes(k))) {
        setRes((r) => ({ ...r, [f]: { estado: "enviando" } }));
        try { const out = await salvarNoDrive({ formato: f, docxBlob, nomeBase, pastaNome: pasta.trim() || undefined }); setRes((r) => ({ ...r, [f]: { estado: "ok", ...out } })); }
        catch (e) { setRes((r) => ({ ...r, [f]: { estado: "erro", msg: e.message } })); }
      }
    } catch (e) { setRes({ geral: { estado: "erro", msg: e.message } }); }
    setOcupado(false);
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && !ocupado && fechar()}>
      <div className="caixa">
        <h2>Salvar no Google Drive</h2>
        {!driveConfigurado ? (
          <p>O envio para o Drive ainda não foi configurado neste site. Defina a variável <code>VITE_GOOGLE_CLIENT_ID</code> (veja a seção “Google Drive” do README) e publique de novo.</p>
        ) : <>
          {erros.length > 0 && <p className="nota">Atenção: o plano tem {erros.length} pendência(s). Você pode enviar mesmo assim.</p>}
          <div className="campo"><span>Formatos</span>
            {FORMATOS.map(([k, n]) => (
              <label key={k} className="check"><input type="checkbox" checked={sel.includes(k)} onChange={() => alterna(k)} disabled={ocupado} />
                <span>{n}{res[k] && <ResDrive r={res[k]} />}</span></label>
            ))}
          </div>
          <Campo rotulo="Pasta no Drive" dica="criada na raiz do seu Drive se ainda não existir" valor={pasta} onChange={setPasta} disabled={ocupado} />
          <p className="nota">Se já existir um arquivo com o mesmo nome nessa pasta, ele é substituído e o Drive guarda a versão anterior no histórico.</p>
          {res.geral && <p className="erro">{res.geral.msg}</p>}
        </>}
        <div className="acoes">
          <button onClick={fechar} disabled={ocupado}>Fechar</button>
          {driveConfigurado && <button className="pri" onClick={enviar} disabled={ocupado || !sel.length}>{ocupado ? "Enviando…" : "Enviar para o Drive"}</button>}
        </div>
      </div>
    </div>
  );
}

function ResDrive({ r }) {
  if (r.estado === "enviando") return <small className="st"> — enviando…</small>;
  if (r.estado === "erro") return <small className="st erro"> — {r.msg}</small>;
  return <small className="st ok"> — {r.substituido ? "atualizado" : "salvo"} · <a href={r.webViewLink} target="_blank" rel="noreferrer">abrir no Drive</a></small>;
}
