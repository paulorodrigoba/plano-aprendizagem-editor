# Editor de Plano de Aprendizagem (FAMETRO)

Editor manual dos Planos de Aprendizagem, no template do NDE. Não usa IA: você preenche cada seção, o app valida a estrutura e exporta em **DOCX** e **PDF**.

## O que o app faz

- **Planos salvos numa pasta do seu computador.** Na primeira vez, você escolhe a pasta (ex.: `Documentos/Planos`). Cada plano vira um arquivo `.json` nessa pasta, e a lista lateral mostra todos eles. A pasta é lembrada nas próximas visitas; o navegador pode pedir para confirmar a permissão.
  - Funciona no **Chrome** e no **Edge** (File System Access API). Em outros navegadores, o app oferece abrir e baixar o `.json`.
  - Se a pasta estiver no OneDrive ou no Google Drive, os planos ganham backup automático.
- **Estrutura do template:** 6 unidades × 5 objetos de conhecimento com numeração contínua (você escolhe o número inicial), 22 aulas, 2 atividades práticas.
- **Plano de aula:** Aulas 9 (N1) e 22 (N2) bloqueadas; Aulas 8 e 21 marcadas como revisão. Em cada aula você marca os objetos tratados, e o campo *Unidade/Tema de estudo* é montado no padrão:
  ```
  UNIDADE DIDÁTICA I: Nome por extenso da unidade
  OBJETO DE CONHECIMENTO 200: Descrição completa
  ```
- **Textos do NDE já preenchidos:** aspecto legal, avaliação (fixos), atividade transversal e atividade de extensão (editáveis; a extensão pode ser desligada).
- **Validação:** campos obrigatórios, 3 + 5 referências, aulas completas, objetos fora do bloco da prova e objetos que não aparecem em nenhuma aula.
- **Exportação:**
  - **DOCX** gerado no navegador (biblioteca `docx`), no layout do template. Pode ser salvo direto na pasta dos planos.
  - **PDF** pela impressão do navegador: em *Exportar PDF*, escolha **Salvar como PDF** no destino. O nome do arquivo já vem sugerido.
- **Google Drive:** o botão *Google Drive* envia o plano para uma pasta do seu Drive (padrão: `Planos de Aprendizagem`) em **Word (.docx)**, **Google Docs** e/ou **PDF**. Se o arquivo já existir na pasta, ele é atualizado e o Drive guarda a versão anterior no histórico. Requer a configuração descrita em [Google Drive](#google-drive).
- **Atalho:** `Ctrl+S` salva. Um rascunho fica guardado no navegador para não perder nada se a aba fechar.

## Rodar localmente

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # gera a versão de produção em dist/
```

## Publicar na Vercel

1. Crie um repositório no GitHub e envie este projeto:
   ```bash
   git init
   git add .
   git commit -m "Editor de Plano de Aprendizagem"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/plano-aprendizagem-editor.git
   git push -u origin main
   ```
2. Em vercel.com → **Add New → Project**, importe o repositório. A Vercel detecta o Vite sozinha (build `npm run build`, saída `dist`). Clique em **Deploy**.
3. Cada `git push` na branch `main` publica uma nova versão.

Os planos **não** ficam na Vercel: ficam só na pasta do seu computador. O site é apenas a ferramenta.

## Google Drive

O envio usa o login do Google direto no navegador, com a permissão `drive.file`: o app só enxerga os arquivos e pastas que ele mesmo criou no seu Drive, nada além disso. Configuração (uma vez só, ~10 minutos):

1. Acesse **console.cloud.google.com** com sua conta Google e crie um projeto (ex.: `plano-aprendizagem`).
2. **APIs e serviços → Biblioteca:** ative a **Google Drive API**.
3. **APIs e serviços → Tela de consentimento OAuth** (ou *Google Auth Platform*):
   - Tipo de usuário: **Externo** (ou **Interno**, se a conta for do Google Workspace da instituição).
   - Preencha nome do app e e-mail de suporte.
   - Em **Escopos/Acesso a dados**, adicione `.../auth/drive.file`.
   - Enquanto o app estiver em modo **Teste**, cadastre em **Usuários de teste** os e-mails que vão usar o envio (até 100).
4. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth:**
   - Tipo: **Aplicativo da Web**.
   - **Origens JavaScript autorizadas:** o endereço do site na Vercel (ex.: `https://plano-aprendizagem-editor.vercel.app`) e, para testar localmente, `http://localhost:5173`.
   - Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).
5. **Na Vercel:** *Project → Settings → Environment Variables* → crie `VITE_GOOGLE_CLIENT_ID` com o ID do cliente e faça um novo deploy.
6. **Localmente:** crie um arquivo `.env.local` na raiz do projeto com
   ```
   VITE_GOOGLE_CLIENT_ID=SEU_ID.apps.googleusercontent.com
   ```

Observações:
- O ID do cliente não é segredo (fica visível no navegador); não há chave secreta no projeto.
- No modo Teste, o Google mostra um aviso de “app não verificado” no primeiro login; basta continuar. Para liberar a qualquer conta sem o aviso, publique o app na tela de consentimento (o escopo `drive.file` não exige auditoria de segurança).
- O PDF enviado ao Drive é gerado pelo próprio Google a partir do .docx (conversão para Google Docs e exportação), por isso pode ter pequenas diferenças em relação ao PDF impresso pelo navegador.

## Estrutura

```
src/
  model.js        modelo de dados, textos fixos, numeração, validação
  textosNDE.json  textos da transversal e da extensão extraídos do template do NDE
  storage.js      pasta local (File System Access API) e alternativa por download
  drive.js        login do Google e envio para o Drive (docx, Google Docs, PDF)
  exportDocx.js   geração do .docx
  Documento.jsx   documento para pré-visualização e PDF
  App.jsx         interface do editor
public/logo.png   logotipo usado no documento
```

## Formato do arquivo do plano

Cada plano é um `.json` legível. Nas aulas, `objetos` guarda os índices dos objetos de conhecimento (0 a 29); o número exibido é `numeroInicial + índice`. Assim, mudar o número inicial não desfaz as escolhas das aulas.
