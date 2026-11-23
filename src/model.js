// Modelo de dados do Plano de Aprendizagem, textos fixos do template do NDE e validação.
import NDE from "./textosNDE.json";

export const ROMANOS = ["I", "II", "III", "IV", "V", "VI"];
export const N_UNIDADES = 6;
export const N_OBJETOS = 5;
export const N_AULAS = 22;
export const AULA_N1 = 9;
export const AULA_N2 = 22;
export const AULA_REV_N1 = 8;
export const AULA_REV_N2 = 21;

export const ASPECTO_LEGAL =
  "Resolução CNE/CES nº 5, de 16 de novembro de 2016 – Diretrizes Curriculares Nacionais para os cursos de graduação na área de Computação.";

export const AULAS_FIXAS = {
  [AULA_N1]: {
    objetivos: "Consolidar e avaliar os conteúdos das Unidades Didáticas I e II.",
    tema: "Unidades I e II.",
    estrategia: "Aplicação da Prova Institucional N1.",
    avaliacao: "Avaliação somativa institucional."
  },
  [AULA_N2]: {
    objetivos: "Consolidar e avaliar os conteúdos das Unidades Didáticas V e VI.",
    tema: "Unidades V e VI.",
    estrategia: "Aplicação da Prova Institucional N2.",
    avaliacao: "Avaliação somativa institucional."
  }
};

export const AVALIACAO_FIXA = [
  { t: "A sistemática de avaliação será de acordo com o Regimento Interno da FAMETRO. Serão realizadas avaliações diagnósticas, formativas e somativas, com foco nas competências e habilidades desenvolvidas por meio da participação dos acadêmicos nas atividades da disciplina, conforme metodologias planejadas e executadas, sendo as avaliações somativas realizadas conforme o Calendário Acadêmico." },
  { t: "Para fins de orientação, consiste:" },
  { b: "1. Avaliação diagnóstica: ", t: "terá como objetivo identificar os conhecimentos prévios em relação aos conteúdos abordados, ou seja, no início das aulas." },
  { b: "2. Avaliação formativa: ", t: "irá realimentar o processo de ensino e aprendizagem. Isto é, a partir dos seus resultados, o professor (a) reestrutura suas abordagens. Seu registro deve ter como com base as metodologias propostas para a construção do conhecimento, através de parciais no decorrer do período, por meio de trabalhos em grupo, além de atividades interdisciplinares e transversais, para avaliar a capacidade de trabalhar em equipe, a capacidade de lidar com o contraditório, aprender a capacidade de organização e de cumprimento de prazos." },
  { b: "3. Avaliação somativa: ", t: "A avaliação somatória será realizada de acordo com as normas regimentais institucionais o processo de avaliação ocorrerá em três etapas para aferir os conhecimentos adquiridos através das provas N1, N2 e PF." },
  { t: "Esse tipo de avaliação será realizado em três momentos específicos durante o período letivo, assim, o semestre letivo terá três frações denominadas N1 e N2" },
  { b: "Composição das notas:" },
  { b: "Nota N1: ", t: "Avaliação Institucional 8,0 + Transversal 2,0 = 10,0" },
  { b: "Nota N2: ", t: "Avaliação Parcial (9,0 + 1,0 Extensão) = 10,0 | Avaliação Institucional = 10,0" },
  { b: "Média*: ", t: "(N1 + N2) / 2 = ou > QUE 6.0 para ser aprovado" },
  { t: "* Serão considerados aprovados os acadêmicos que obtiverem média igual ou superior a seis pontos (6,0). A frequência mínima para aprovação é de 75% de presença." },
  { b: "N1 – Nota 1 (1 prova e questões transversais)" },
  { t: "• Prova Institucional N1 (unidade 1 e 2 completas) – somatório 10 pontos" },
  { t: "a) 8 Questões Objetivas – somatório 4 pontos" },
  { t: "b) 1 Discursiva (Texto de 30 linhas Dissertação/ Problematização/Estudo de caso) somatório 4 pontos." },
  { t: "c) 2 questões da Transversal objetiva – somatório 2 pontos" },
  { b: "N2 – Nota 2 (1 prova e atividades parciais e extensão)" },
  { t: "• Prova Institucional N2: (Unidade 5 e 6 completas) somatório de 10 pontos" },
  { t: "a) 8 questões objetivas – somatório de 6 pontos" },
  { t: "b) 1 Questão Dissertativa – somatório de 4 pontos" },
  { t: "c) Atividades Parcial (Unidade 3 e 4 completas) somatório de 9 pontos Atividade de Extensão em composição com a Parcial somatório de 1 ponto" },
  { b: "EXAME FINAL – MÉDIA PARA APROVAÇÃO NOTA 5." },
  { t: "Prova única com 6 questões objetivas inéditas (uma de cada unidade curricular) com somatório de 6 pontos e 1 questão discursiva com somatório de 4 pontos" },
  { t: "A SOMA DA NOTA 1 + NOTA 2, DIVIDIDO POR DOIS, O RESULTADO SENDO MAIOR OU IGUAL A 6,0 E 75% DE FRENQUENCIA (APROVADO)." },
  { t: "A SOMA DA NOTA 1 + NOTA 2 , DIVIDIDO POR DOIS , O RESULTADO SENDO MENOR QUE 6,0 (REPROVADO)." },
  { b: "O aluno com média final entre 4,0 à 5,99 fará exame final" },
  { b: "Média do Exame Final = 5,0 (todo conteúdo do semestre)" },
  { b: "75% de frequência" }
];

const ref = () => ({ autoria: "", titulo: "", complemento: "" });

export function novoPlano() {
  return {
    versao: 1,
    componente: "", curso: "", periodo: "", carga: "",
    ementa: "", objetivoGeral: "",
    objEsp: { cognitivos: "", procedimentais: "", atitudinais: "" },
    habilidades: { cognitivas: "", procedimentais: "", atitudinais: "" },
    numeroInicial: 1,
    unidades: Array.from({ length: N_UNIDADES }, () => ({ nome: "", objetos: Array(N_OBJETOS).fill("") })),
    perfilEgresso: "",
    bibBasica: Array.from({ length: 3 }, ref),
    bibComplementar: Array.from({ length: 5 }, ref),
    materiais: "",
    articulacao: "",
    transversal: { aspectoLegal: NDE.transversalAspectoLegal, metodologia: NDE.transversalMetodologia },
    incluirExtensao: true,
    extensao: { aspectoLegal: NDE.extensaoAspectoLegal, metodologia: NDE.extensaoMetodologia, titulo: NDE.extensaoTitulo, disciplinas: NDE.extensaoDisciplinas },
    metodologia: "",
    // objetos = índices globais (0..29) dos objetos de conhecimento tratados na aula
    aulas: Array.from({ length: N_AULAS }, () => ({ objetivos: "", objetos: [], estrategia: "", avaliacao: "" })),
    atividadesPraticas: Array.from({ length: 2 }, () => ({ tema: "", objetivos: "", processo: "", descricao: "" })),
    professor: "", coordenador: "", dataProfessor: "", dataCoordenador: ""
  };
}

// Garante que um plano aberto de arquivo tenha todos os campos (arquivos antigos ou editados à mão).
export function normalizar(p) {
  const base = novoPlano();
  const m = { ...base, ...p };
  for (const k of ["objEsp", "habilidades", "transversal", "extensao"]) m[k] = { ...base[k], ...(p[k] || {}) };
  m.unidades = base.unidades.map((u, i) => ({ nome: p.unidades?.[i]?.nome || "", objetos: u.objetos.map((_, j) => p.unidades?.[i]?.objetos?.[j] || "") }));
  m.bibBasica = base.bibBasica.map((r, i) => ({ ...r, ...(p.bibBasica?.[i] || {}) }));
  m.bibComplementar = base.bibComplementar.map((r, i) => ({ ...r, ...(p.bibComplementar?.[i] || {}) }));
  m.aulas = base.aulas.map((a, i) => ({ ...a, ...(p.aulas?.[i] || {}), objetos: Array.isArray(p.aulas?.[i]?.objetos) ? p.aulas[i].objetos : [] }));
  m.atividadesPraticas = base.atividadesPraticas.map((a, i) => ({ ...a, ...(p.atividadesPraticas?.[i] || {}) }));
  m.numeroInicial = parseInt(m.numeroInicial, 10) || 1;
  return m;
}

export const numeroObjeto = (p, idx) => (parseInt(p.numeroInicial, 10) || 1) + idx;
export const linhas = (s) => String(s || "").split("\n").map((l) => l.trim()).filter(Boolean);
export const paragrafos = (s) => String(s || "").split("\n");

// Texto do campo UNIDADE/TEMA DE ESTUDO de uma aula, no padrão definido.
export function temaAula(p, n) {
  if (AULAS_FIXAS[n]) return [AULAS_FIXAS[n].tema];
  const sel = new Set(p.aulas[n - 1].objetos);
  const out = [];
  p.unidades.forEach((u, i) => {
    const os = u.objetos.map((t, j) => ({ idx: i * N_OBJETOS + j, t })).filter((o) => sel.has(o.idx));
    if (!os.length) return;
    out.push(`UNIDADE DIDÁTICA ${ROMANOS[i]}: ${u.nome}`);
    os.forEach((o) => out.push(`OBJETO DE CONHECIMENTO ${numeroObjeto(p, o.idx)}: ${o.t}`));
  });
  return out;
}

export function aulaEfetiva(p, n) {
  const f = AULAS_FIXAS[n];
  const a = p.aulas[n - 1];
  return f ? { ...f, tema: [f.tema] } : { ...a, tema: temaAula(p, n) };
}

export const refTexto = (r) => `${r.autoria || ""}${r.titulo || ""}${r.complemento || ""}`.trim();

export function validar(p) {
  const e = [];
  const req = (v, nome, sec) => { if (!String(v || "").trim()) e.push({ sec, msg: `${nome} não preenchido(a).` }); };
  req(p.componente, "Componente curricular", "identificacao");
  req(p.curso, "Curso", "identificacao");
  req(p.periodo, "Período", "identificacao");
  req(p.carga, "Carga horária", "identificacao");
  req(p.ementa, "Ementa", "ementa");
  req(p.objetivoGeral, "Objetivo geral", "objetivos");
  for (const [k, n] of [["cognitivos", "Cognitivos"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]])
    if (!linhas(p.objEsp[k]).length) e.push({ sec: "objetivos", msg: `Objetivos específicos ${n.toLowerCase()} vazios.` });
  for (const [k, n] of [["cognitivas", "Cognitivas"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]])
    if (!linhas(p.habilidades[k]).length) e.push({ sec: "habilidades", msg: `Habilidades e competências ${n.toLowerCase()} vazias.` });
  p.unidades.forEach((u, i) => {
    if (!u.nome.trim()) e.push({ sec: "unidades", msg: `Unidade Didática ${ROMANOS[i]} sem nome.` });
    u.objetos.forEach((o, j) => { if (!o.trim()) e.push({ sec: "unidades", msg: `Objeto de Conhecimento ${numeroObjeto(p, i * N_OBJETOS + j)} (Unidade ${ROMANOS[i]}) vazio.` }); });
  });
  req(p.perfilEgresso, "Contribuições para o perfil do egresso", "egresso");
  p.bibBasica.forEach((r, i) => { if (!r.autoria.trim() || !r.titulo.trim()) e.push({ sec: "bibliografia", msg: `Bibliografia básica ${i + 1}: autoria e título são obrigatórios.` }); });
  p.bibComplementar.forEach((r, i) => { if (!r.autoria.trim() || !r.titulo.trim()) e.push({ sec: "bibliografia", msg: `Bibliografia complementar ${i + 1}: autoria e título são obrigatórios.` }); });
  req(p.materiais, "Materiais de apoio", "bibliografia");
  req(p.articulacao, "Articulações com outras unidades curriculares", "articulacao");
  req(p.metodologia, "Metodologia", "metodologia");
  const usados = new Set();
  for (let n = 1; n <= N_AULAS; n++) {
    if (AULAS_FIXAS[n]) continue;
    const a = p.aulas[n - 1];
    if (!a.objetivos.trim()) e.push({ sec: "aulas", msg: `Aula ${n}: objetivos de aprendizagem vazios.` });
    if (!a.objetos.length) e.push({ sec: "aulas", msg: `Aula ${n}: nenhum objeto de conhecimento selecionado.` });
    if (!a.estrategia.trim()) e.push({ sec: "aulas", msg: `Aula ${n}: estratégia de ensino vazia.` });
    if (!a.avaliacao.trim()) e.push({ sec: "aulas", msg: `Aula ${n}: avaliação formativa vazia.` });
    a.objetos.forEach((o) => usados.add(o));
    // Aulas 1–8 devem tratar só das Unidades I e II; Aulas 10–21, das Unidades III a VI.
    const foraN1 = n <= AULA_REV_N1 && a.objetos.some((o) => o >= 2 * N_OBJETOS);
    const foraN2 = n > AULA_N1 && a.objetos.some((o) => o < 2 * N_OBJETOS);
    if (foraN1) e.push({ sec: "aulas", msg: `Aula ${n}: antes da N1 só devem entrar objetos das Unidades I e II.`, aviso: true });
    if (foraN2) e.push({ sec: "aulas", msg: `Aula ${n}: após a N1 só devem entrar objetos das Unidades III a VI.`, aviso: true });
  }
  for (let i = 0; i < N_UNIDADES * N_OBJETOS; i++)
    if (!usados.has(i)) e.push({ sec: "aulas", msg: `Objeto de Conhecimento ${numeroObjeto(p, i)} não aparece em nenhuma aula.`, aviso: true });
  p.atividadesPraticas.forEach((a, i) => { if (!a.tema.trim() || !a.descricao.trim()) e.push({ sec: "praticas", msg: `Atividade Prática ${i + 1}: tema e descrição são obrigatórios.` }); });
  return e;
}

export function nomeArquivo(p, ext) {
  const base = (p.componente || "plano").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "").toUpperCase();
  return `PLANO_DE_APRENDIZAGEM_${base || "SEM_NOME"}.${ext}`;
}
