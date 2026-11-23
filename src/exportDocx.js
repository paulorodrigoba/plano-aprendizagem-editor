// Gera o .docx no layout do template do NDE (A4, Arial 11, faixa azul 002060, rótulos cinza E8E8E8).
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, ImageRun, Footer, PageNumber, VerticalAlign
} from "docx";
import { ROMANOS, ASPECTO_LEGAL, AVALIACAO_FIXA, N_AULAS, AULA_N1, AULA_N2, aulaEfetiva, numeroObjeto, linhas, paragrafos } from "./model.js";

const FULL = 10466, LAB = 2600, VAL = FULL - LAB;
const run = (t, o = {}) => new TextRun({ text: t || "", font: "Arial", size: 22, ...o });
const para = (children, o = {}) => new Paragraph({ children, spacing: { after: 60 }, ...o });
const p = (t, o = {}, ro = {}) => para([run(t, ro)], o);
const J = { alignment: AlignmentType.JUSTIFIED };
const texto = (s) => paragrafos(s).map((l) => p(l, J));
const lista = (s) => { const l = linhas(s); return l.length ? l.map((x) => p(x)) : [p("")]; };
const cell = (children, o = {}) => new TableCell({ children, verticalAlign: VerticalAlign.CENTER, margins: { top: 60, bottom: 60, left: 100, right: 100 }, ...o });
const lab = (t, w = LAB, o = {}) => cell([p(t, {}, { bold: true })], { width: { size: w, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "E8E8E8" }, ...o });
const val = (children, w = VAL, o = {}) => cell(children, { width: { size: w, type: WidthType.DXA }, ...o });
const table = (rows, cols) => new Table({ rows, width: { size: FULL, type: WidthType.DXA }, columnWidths: cols });
const row = (children) => new TableRow({ children });
const gap = () => new Paragraph({ children: [], spacing: { after: 120 } });
const kv = (label, children) => [table([row([lab(label), val(children)])], [LAB, VAL]), gap()];
const band = (t) => [table([row([cell([p(t, { alignment: AlignmentType.CENTER }, { bold: true, color: "FFFFFF", size: 28 })], {
  width: { size: FULL, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "002060" } })])], [FULL]), gap()];
const ref = (r, i) => para([run(`${i + 1}. `), run(r.autoria), run(r.titulo, { bold: true }), run(r.complemento)]);
const grupos = (o, nomes) => nomes.flatMap(([k, rot]) => [p(rot + ":", {}, { bold: true }), ...lista(o[k])]);

export function montarDocumento(P, logo) {
  const c = [];
  if (logo) c.push(new Paragraph({ children: [new ImageRun({ type: "png", data: logo, transformation: { width: 144, height: 44 } })], spacing: { after: 120 } }));
  c.push(...band("PLANO DE APRENDIZAGEM"));
  c.push(table([
    row([lab("COMPONENTE:"), val([p("UNIDADE CURRICULAR: " + P.componente)])]),
    row([lab("PERIODO:"), val([p(`${P.periodo} – ${P.curso} – PPC 2025`)])]),
    row([lab("CARGA HORÁRIA:"), val([p(P.carga)])])
  ], [LAB, VAL]), gap());
  c.push(...kv("ASPECTO LEGAL:", [p(ASPECTO_LEGAL)]));
  c.push(...kv("EMENTA:", texto(P.ementa)));
  c.push(table([
    row([lab("OBJETIVO DE APRENDIZAGEM"), val([p("")])]),
    row([lab("OBJETIVO GERAL"), val(texto(P.objetivoGeral))]),
    row([lab("OBJETIVOS ESPECIFICOS"), val(grupos(P.objEsp, [["cognitivos", "Cognitivos"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]]))])
  ], [LAB, VAL]), gap());
  c.push(...kv("HABILIDADES E COMPETENCIAS", grupos(P.habilidades, [["cognitivas", "Cognitivas"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]])));
  c.push(table([
    row([lab("UNIDADES/CONTEUDOS PROGRAMÁTICOS"), val([p("")])]),
    ...P.unidades.map((u, i) => row([
      lab(`Unidade Didática ${ROMANOS[i]}`),
      val([p(u.nome, {}, { bold: true }), ...u.objetos.map((o, j) => p(`Objeto de Conhecimento ${numeroObjeto(P, i * 5 + j)}: ${o}`))])
    ]))
  ], [LAB, VAL]), gap());
  c.push(table([
    row([lab("PERFIL DO EGRESSO"), val([p("")])]),
    row([lab("CONTRIBUIÇÕES PARA O PERFIL DO EGRESSO"), val(texto(P.perfilEgresso))])
  ], [LAB, VAL]), gap());
  c.push(table([
    row([lab("BIBLIOGRAFIA"), val([p("")])]),
    row([lab("BIBLIOGRAFIA BÁSICA"), val(P.bibBasica.map(ref))]),
    row([lab("BIBLIOGRAFIA COMPLEMENTAR"), val(P.bibComplementar.map(ref))]),
    row([lab("MATERIAIS DE APOIO, ATUALIDADE E INOVAÇÕES"), val(lista(P.materiais))])
  ], [LAB, VAL]), gap());
  c.push(...kv("ARTICULAÇÕES COM OUTRAS UNIDADES CURRICULARES", texto(P.articulacao)));
  c.push(table([
    row([lab("ATIVIDADE TRANVERSAL"), val([p("")])]),
    row([lab("Aspecto Legal"), val(texto(P.transversal.aspectoLegal))]),
    row([lab("Metodologia"), val(texto(P.transversal.metodologia))])
  ], [LAB, VAL]), gap());
  if (P.incluirExtensao) {
    c.push(table([
      row([lab("ATIVIDADE DE EXTENSÃO"), val([p("")])]),
      row([lab("Aspecto Legal"), val(texto(P.extensao.aspectoLegal))]),
      row([lab("Metodologia"), val(texto(P.extensao.metodologia))])
    ], [LAB, VAL]), gap());
    c.push(...kv("TÍTULO DO PROJETO", texto(P.extensao.titulo)));
    c.push(...kv("DISCIPLINAS COM CARGA HORÁRIA DE EXTENSÃO", lista(P.extensao.disciplinas)));
  }
  c.push(...band("METODOLOGIA"));
  c.push(table([row([val(texto(P.metodologia), FULL)])], [FULL]), gap());
  c.push(...band("AVALIAÇÃO"));
  c.push(table([row([val(AVALIACAO_FIXA.map((x) => para([x.b ? run(x.b, { bold: true }) : null, x.t ? run(x.t) : null].filter(Boolean), J)), FULL)])], [FULL]), gap());

  const A1 = 1300, A2 = 3400, A3 = 3000, A4 = FULL - A1 - A2 - A3;
  for (let n = 1; n <= N_AULAS; n++) {
    const a = aulaEfetiva(P, n);
    c.push(table([
      row([lab("AULA", A1), lab("OBJETIVOS DE APRENDIZAGEM", A2 + A3 + A4, { columnSpan: 3 })]),
      row([val([p(String(n), { alignment: AlignmentType.CENTER }, { bold: true })], A1), val(texto(a.objetivos), A2 + A3 + A4, { columnSpan: 3 })]),
      row([lab("UNIDADE/TEMA DE ESTUDO", A1 + A2, { columnSpan: 2 }), lab("ESTRATÉGIA DE ENSINO/APRENDIZAGEM", A3), lab("AVALIAÇÃO FORMATIVA", A4)]),
      row([val((a.tema.length ? a.tema : [""]).map((l) => p(l, {}, { bold: /^UNIDADE DID/.test(l) })), A1 + A2, { columnSpan: 2 }), val(texto(a.estrategia), A3), val(texto(a.avaliacao), A4)])
    ], [A1, A2, A3, A4]), gap());
  }

  const B = FULL / 4;
  P.atividadesPraticas.forEach((ap, i) => {
    c.push(table([
      row([lab(`ATIVIDADE PRÁTICA ${i + 1}`, FULL, { columnSpan: 4 })]),
      row([lab("Nº", B), lab("TEMA DE ESTUDO", B), lab("OBJETIVOS DE APRENDIZAGEM", B), lab("PROCESSO COGNITIVO/OPERAÇÃO MENTAL", B)]),
      row([val([p(String(i + 1))], B), val(texto(ap.tema), B), val(texto(ap.objetivos), B), val(texto(ap.processo), B)]),
      row([lab("DESCRIÇÃO DA ATIVIDADE", B), val(texto(ap.descricao), FULL - B, { columnSpan: 3 })])
    ], [B, B, B, B]), gap());
  });

  const R = FULL / 3;
  c.push(table([
    row([lab("RESPONSAVEIS PELAS INFORMAÇÕES", FULL, { columnSpan: 3 })]),
    row([val([p("PROFESSOR(A): " + P.professor)], R), val([p("ASSINATURA:")], R), val([p("DATA: " + (P.dataProfessor || "____/____/______"))], R)]),
    row([val([p("COORDENADOR(A)/NDE: " + P.coordenador)], R), val([p("ASSINATURA:")], R), val([p("DATA: " + (P.dataCoordenador || "____/____/______"))], R)])
  ], [R, R, R]));

  return new Document({
    creator: "Editor de Plano de Aprendizagem",
    title: "Plano de Aprendizagem – " + P.componente,
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
        run(P.componente + "   |   PPC 2025   |   ", { size: 16 }),
        new TextRun({ children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], font: "Arial", size: 16 })
      ] })] }) },
      children: c
    }]
  });
}

export async function gerarDocx(P) {
  let logo = null;
  try { logo = new Uint8Array(await (await fetch("/logo.png")).arrayBuffer()); } catch {}
  return Packer.toBlob(montarDocumento(P, logo));
}

// usado nos testes (Node)
export const _aulas = { AULA_N1, AULA_N2 };
