// Documento no layout do template do NDE — usado na pré-visualização e na impressão em PDF.
import { ROMANOS, ASPECTO_LEGAL, AVALIACAO_FIXA, N_AULAS, aulaEfetiva, numeroObjeto, linhas, paragrafos } from "./model.js";

const T = ({ s }) => paragrafos(s).map((l, i) => <p key={i}>{l || " "}</p>);
const L = ({ s }) => linhas(s).map((l, i) => <p key={i}>{l}</p>);
const Ref = ({ r, i }) => <p>{i + 1}. {r.autoria}<b>{r.titulo}</b>{r.complemento}</p>;
const Band = ({ t }) => <div className="d-band">{t}</div>;
const KV = ({ rows }) => (
  <table className="d-kv"><tbody>{rows.map(([k, v], i) => <tr key={i}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
);
const Grupos = ({ o, nomes }) => nomes.map(([k, n]) => <div key={k}><p><b>{n}:</b></p><L s={o[k]} /></div>);

export default function Documento({ P }) {
  return (
    <article className="doc">
      <img className="d-logo" src="/logo.png" alt="FAMETRO Centro Universitário" />
      <Band t="PLANO DE APRENDIZAGEM" />
      <KV rows={[["COMPONENTE:", "UNIDADE CURRICULAR: " + P.componente], ["PERIODO:", `${P.periodo} – ${P.curso} – PPC 2025`], ["CARGA HORÁRIA:", P.carga]]} />
      <KV rows={[["ASPECTO LEGAL:", ASPECTO_LEGAL]]} />
      <KV rows={[["EMENTA:", <T s={P.ementa} />]]} />
      <KV rows={[["OBJETIVO DE APRENDIZAGEM", ""], ["OBJETIVO GERAL", <T s={P.objetivoGeral} />],
        ["OBJETIVOS ESPECIFICOS", <Grupos o={P.objEsp} nomes={[["cognitivos", "Cognitivos"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]]} />]]} />
      <KV rows={[["HABILIDADES E COMPETENCIAS", <Grupos o={P.habilidades} nomes={[["cognitivas", "Cognitivas"], ["procedimentais", "Procedimentais"], ["atitudinais", "Atitudinais"]]} />]]} />
      <KV rows={[["UNIDADES/CONTEUDOS PROGRAMÁTICOS", ""], ...P.unidades.map((u, i) => [`Unidade Didática ${ROMANOS[i]}`,
        <><p><b>{u.nome}</b></p>{u.objetos.map((o, j) => <p key={j}>Objeto de Conhecimento {numeroObjeto(P, i * 5 + j)}: {o}</p>)}</>])]} />
      <KV rows={[["PERFIL DO EGRESSO", ""], ["CONTRIBUIÇÕES PARA O PERFIL DO EGRESSO", <T s={P.perfilEgresso} />]]} />
      <KV rows={[["BIBLIOGRAFIA", ""], ["BIBLIOGRAFIA BÁSICA", P.bibBasica.map((r, i) => <Ref key={i} r={r} i={i} />)],
        ["BIBLIOGRAFIA COMPLEMENTAR", P.bibComplementar.map((r, i) => <Ref key={i} r={r} i={i} />)],
        ["MATERIAIS DE APOIO, ATUALIDADE E INOVAÇÕES", <L s={P.materiais} />]]} />
      <KV rows={[["ARTICULAÇÕES COM OUTRAS UNIDADES CURRICULARES", <T s={P.articulacao} />]]} />
      <KV rows={[["ATIVIDADE TRANVERSAL", ""], ["Aspecto Legal", <T s={P.transversal.aspectoLegal} />], ["Metodologia", <T s={P.transversal.metodologia} />]]} />
      {P.incluirExtensao && <>
        <KV rows={[["ATIVIDADE DE EXTENSÃO", ""], ["Aspecto Legal", <T s={P.extensao.aspectoLegal} />], ["Metodologia", <T s={P.extensao.metodologia} />]]} />
        <KV rows={[["TÍTULO DO PROJETO", <T s={P.extensao.titulo} />]]} />
        <KV rows={[["DISCIPLINAS COM CARGA HORÁRIA DE EXTENSÃO", <L s={P.extensao.disciplinas} />]]} />
      </>}
      <Band t="METODOLOGIA" />
      <table className="d-kv"><tbody><tr><td><T s={P.metodologia} /></td></tr></tbody></table>
      <Band t="AVALIAÇÃO" />
      <table className="d-kv"><tbody><tr><td>{AVALIACAO_FIXA.map((x, i) => <p key={i}>{x.b && <b>{x.b}</b>}{x.t}</p>)}</td></tr></tbody></table>
      {Array.from({ length: N_AULAS }, (_, k) => {
        const n = k + 1, a = aulaEfetiva(P, n);
        return (
          <div className="d-bloco" key={n}><table className="d-aula"><colgroup><col style={{ width: "12%" }} /><col style={{ width: "33%" }} /><col style={{ width: "29%" }} /><col style={{ width: "26%" }} /></colgroup><tbody>
            <tr><th>AULA</th><th colSpan={3}>OBJETIVOS DE APRENDIZAGEM</th></tr>
            <tr><td className="d-num">{n}</td><td colSpan={3}><T s={a.objetivos} /></td></tr>
            <tr><th colSpan={2}>UNIDADE/TEMA DE ESTUDO</th><th>ESTRATÉGIA DE ENSINO/APRENDIZAGEM</th><th>AVALIAÇÃO FORMATIVA</th></tr>
            <tr><td colSpan={2}>{a.tema.map((l, i) => <p key={i}>{/^UNIDADE DID/.test(l) ? <b>{l}</b> : l}</p>)}</td><td><T s={a.estrategia} /></td><td><T s={a.avaliacao} /></td></tr>
          </tbody></table></div>
        );
      })}
      {P.atividadesPraticas.map((ap, i) => (
        <div className="d-bloco" key={i}><table className="d-aula"><tbody>
          <tr><th colSpan={4}>ATIVIDADE PRÁTICA {i + 1}</th></tr>
          <tr><th>Nº</th><th>TEMA DE ESTUDO</th><th>OBJETIVOS DE APRENDIZAGEM</th><th>PROCESSO COGNITIVO/OPERAÇÃO MENTAL</th></tr>
          <tr><td>{i + 1}</td><td><T s={ap.tema} /></td><td><T s={ap.objetivos} /></td><td><T s={ap.processo} /></td></tr>
          <tr><th>DESCRIÇÃO DA ATIVIDADE</th><td colSpan={3}><T s={ap.descricao} /></td></tr>
        </tbody></table></div>
      ))}
      <table className="d-aula"><tbody>
        <tr><th colSpan={3}>RESPONSAVEIS PELAS INFORMAÇÕES</th></tr>
        <tr><td>PROFESSOR(A): {P.professor}</td><td>ASSINATURA:</td><td>DATA: {P.dataProfessor || "____/____/______"}</td></tr>
        <tr><td>COORDENADOR(A)/NDE: {P.coordenador}</td><td>ASSINATURA:</td><td>DATA: {P.dataCoordenador || "____/____/______"}</td></tr>
      </tbody></table>
    </article>
  );
}
