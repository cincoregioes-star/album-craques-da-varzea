
/* Áudio extra para ficha técnica/detalhes — Craques da Várzea */
const AUDIO_FICHA_DETALHES_CRAQUES = new Audio("audio/album/abrir-ficha.mp3");
AUDIO_FICHA_DETALHES_CRAQUES.volume = 0.55;
function tocarAudioFichaCraques(){
  try{
    AUDIO_FICHA_DETALHES_CRAQUES.currentTime = 0;
    AUDIO_FICHA_DETALHES_CRAQUES.play();
  }catch(e){}
}

const TEMA = window.ALBUM_TEMA || {};
const CONFIG = TEMA.regras || {};
const PAGE_CONFIG = TEMA.paginas || [];

const FIGURINHAS = PAGE_CONFIG.flatMap(page => page.itens.map((item, idx) => {
  const numero = (page.paginaAlbum - 4) * 6 + idx + 1;
  const itemObj = Array.isArray(item)
    ? { titulo: item[0], descricao: item[1] }
    : item;

  return {
    id: itemObj.id || `fig-${String(numero).padStart(2, "0")}`,
    numero: itemObj.numero || numero,
    paginaAlbum: page.paginaAlbum,
    tema: page.tema,
    titulo: itemObj.titulo || `Figurinha ${numero}`,
    descricao: itemObj.descricao || "",
    reflexao: itemObj.reflexao || page.reflexao || "",
    acao: itemObj.acao || page.acao || "",
    ficha: itemObj.ficha || {}
  };
}));

const STORAGE_KEY = TEMA.storageKey || "capsula_modelo_base_v1";
const PAGE_STORAGE_KEY = TEMA.pageStorageKey || "capsula_modelo_base_pagina_v1";
const FIGS_POR_PACOTE = CONFIG.figurinhasPorPacote || 5;

let audioAtivo = false;
let audioLiberado = false;
let audio = {};

function estadoInicial() {
  return {
    album: {},
    pacotes: Number(CONFIG.pacotesIniciais || 3),
    historico: [],
    quizFeitos: {},
    recompensasGame: 0
  };
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (salvo && typeof salvo === "object") {
      return { ...estadoInicial(), ...salvo };
    }
  } catch (e) {}
  return estadoInicial();
}

let estado = carregar();
let paginaAtual = Number(localStorage.getItem(PAGE_STORAGE_KEY) || 1);

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function salvarPagina() {
  localStorage.setItem(PAGE_STORAGE_KEY, String(paginaAtual));
}

function reg(id) {
  if (!estado.album[id]) estado.album[id] = { quantidade: 0, colada: false };
  return estado.album[id];
}

function safe(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[s]));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function caminhosImagem(num) {
  const n2 = pad(num);
  const n = String(num);
  return [
    `figurinhas/figurinha-${n2}.webp`,
    `figurinhas/${n2}.webp`,
    `figurinhas/figurinha-${n}.webp`,
    `figurinhas/figurinha-${n2}.png`,
    `figurinhas/${n2}.png`,
    `figurinhas/figurinha-${n2}.jpg`,
    `figurinhas/figurinha-${n2}.jpeg`
  ];
}

function imgFallback(el) {
  const lista = JSON.parse(el.dataset.fallback || "[]");
  const i = Number(el.dataset.i || 0) + 1;
  if (lista[i]) {
    el.dataset.i = String(i);
    el.src = lista[i];
    return;
  }

  const num = el.dataset.num || "";
  el.outerHTML = `<div class="placeholder"><div class="num">${safe(num)}</div><div class="tema">Imagem não encontrada<br>use figurinhas/figurinha-${safe(num)}.webp</div></div>`;
}

function imagemHTML(fig) {
  const lista = caminhosImagem(fig.numero);
  return `<img src="${lista[0]}" data-fallback='${JSON.stringify(lista)}' data-i="0" data-num="${pad(fig.numero)}" alt="${safe(fig.titulo)}" onerror="imgFallback(this)">`;
}

function totais() {
  const regs = Object.values(estado.album);
  const coladas = regs.filter(r => r.colada).length;
  const disponiveis = regs.reduce((s, r) => s + Math.max(0, (r.quantidade || 0) - (r.colada ? 1 : 0)), 0);
  const repetidas = regs.reduce((s, r) => s + Math.max(0, (r.quantidade || 0) - 1), 0);
  return { coladas, disponiveis, repetidas };
}

function paginas() {
  const arr = [
    { numero: 1, tipo: "capa", titulo: "Capa" },
    { numero: 2, tipo: "como", titulo: "Como funciona" },
    { numero: 3, tipo: "quiz", titulo: "Quiz" }
  ];

  PAGE_CONFIG.forEach(p => {
    const figs = FIGURINHAS.filter(f => f.paginaAlbum === p.paginaAlbum);
    arr.push({
      numero: arr.length + 1,
      tipo: "figs",
      titulo: figs[0]?.tema || p.tema,
      paginaAlbum: p.paginaAlbum,
      tema: p.tema
    });
  });

  arr.push({ numero: arr.length + 1, tipo: "final", titulo: "Página final" });
  return arr;
}

function totalPaginas() {
  return paginas().length;
}

function pagina(n) {
  return paginas().find(p => p.numero === n) || paginas()[0];
}

function par(n) {
  if (n <= 1) return 1;
  return n % 2 === 0 ? n : n - 1;
}

function creditosHTML() {
  return `<div class="creditos">${safe(TEMA.creditos || "Cápsula do Tempo Digital").replaceAll("•", "<b>•</b>")}</div>`;
}

function capaHTML() {
  return `
    <div class="capa-album">
      <div>
        <img class="capa-logo" src="${safe(TEMA.logo || "logo.png")}" alt="Logo" onerror="this.style.display='none'">
        <span class="tag">${safe(TEMA.ano || "2026")}</span>
        <h1>${safe(TEMA.nome || "Cápsula do Tempo Digital")}</h1>
        <h2>${safe(TEMA.subtitulo || "Álbum digital interativo")}</h2>
        <p>${safe(TEMA.chamada || "Memórias em formato digital.")}</p>
        <p><b>${FIGURINHAS.length}</b> figurinhas • <b>${PAGE_CONFIG.length}</b> páginas temáticas • pacotes, quiz e game</p>
      </div>
      ${creditosHTML()}
    </div>
  `;
}

function comoHTML() {
  const cards = (TEMA.comoFunciona || []).map(item => `
    <div class="info-card">
      <b>${safe(item[0])}</b>
      <span>${safe(item[1])}</span>
    </div>
  `).join("");

  return `
    <div class="pagina-especial">
      <div>
        <span class="tag">Manual</span>
        <h2>Como funciona</h2>
        <p>Este modelo-base foi feito para gerar álbuns digitais de qualquer tema.</p>
      </div>
      <div class="info-grid">${cards}</div>
      ${creditosHTML()}
    </div>
  `;
}

function quizIntroHTML() {
  return `
    <div class="pagina-especial">
      <div>
        <span class="tag">Quiz</span>
        <h2>${safe(TEMA.quiz?.titulo || "Quiz do Álbum")}</h2>
        <p>${safe(TEMA.quiz?.descricao || "Responda para ganhar pacotes.")}</p>
      </div>
      <div class="info-grid">
        <div class="info-card"><b>Recompensa máxima</b><span>${CONFIG.recompensaQuizPerfeito || 3} pacotes</span></div>
        <div class="info-card"><b>Participação</b><span>${CONFIG.recompensaQuizParticipacao || 1} pacote</span></div>
        <div class="info-card"><b>Perguntas</b><span>${TEMA.quiz?.perguntas?.length || 0}</span></div>
        <div class="info-card"><b>Ação</b><span>Clique abaixo para responder</span></div>
      </div>
      <button class="btn-dourado" onclick="abrirQuiz()">Responder quiz</button>
      ${creditosHTML()}
    </div>
  `;
}

function figCardHTML(fig) {
  const r = reg(fig.id);
  const disponivel = (r.quantidade || 0) > 0 && !r.colada;
  const colada = !!r.colada;

  let classe = "fig";
  if (disponivel) classe += " disponivel";
  if (colada) classe += " colada";

  const estadoTexto = colada ? "Colada" : disponivel ? "Colar" : "Bloqueada";
  const botao = colada ? "Ver ficha" : disponivel ? "Colar figurinha" : "Não encontrada";

  return `
    <article class="${classe}" onclick="acaoFig('${fig.id}')">
      <div class="arte">
        ${colada ? imagemHTML(fig) : `<div class="placeholder"><div class="num">${pad(fig.numero)}</div><div class="tema">${safe(fig.titulo)}</div></div>`}
        <span class="estado ${colada ? "colada" : disponivel ? "ok" : ""}">${estadoTexto}</span>
      </div>
      <button class="acao" type="button">${botao}</button>
    </article>
  `;
}

function paginaFigsHTML(p) {
  const tema = PAGE_CONFIG.find(x => x.paginaAlbum === p.paginaAlbum);
  const figs = FIGURINHAS.filter(f => f.paginaAlbum === p.paginaAlbum);

  return `
    <div class="page-inner">
      <div class="page-head">
        <span class="label">Página temática</span>
        <h2>${safe(p.titulo)}</h2>
        <small>${figs.length} figurinhas</small>
      </div>
      <div class="texto-pagina">${safe(tema?.resumo || "")}</div>
      <div class="grid-fig">
        ${figs.map(figCardHTML).join("")}
      </div>
      ${creditosHTML()}
    </div>
  `;
}

function finalHTML() {
  const t = totais();
  const completo = t.coladas >= FIGURINHAS.length;

  return `
    <div class="pagina-especial">
      <div>
        <span class="tag">Final</span>
        <h2>${completo ? "Álbum completo!" : "Continue colecionando"}</h2>
        <p>${completo ? "Parabéns! Todas as figurinhas foram coladas." : "Abra pacotes, faça o quiz e jogue o game para completar o álbum."}</p>
      </div>
      <div class="info-grid">
        <div class="info-card"><b>Coladas</b><span>${t.coladas}/${FIGURINHAS.length}</span></div>
        <div class="info-card"><b>Pacotes</b><span>${estado.pacotes}</span></div>
        <div class="info-card"><b>Para colar</b><span>${t.disponiveis}</span></div>
        <div class="info-card"><b>Repetidas</b><span>${t.repetidas}</span></div>
      </div>
      <button class="btn-dourado" onclick="abrirPacoteModal()">Abrir pacote</button>
      ${creditosHTML()}
    </div>
  `;
}

function paginaHTML(p) {
  if (!p) return "";
  if (p.tipo === "capa") return capaHTML();
  if (p.tipo === "como") return comoHTML();
  if (p.tipo === "quiz") return quizIntroHTML();
  if (p.tipo === "figs") return paginaFigsHTML(p);
  if (p.tipo === "final") return finalHTML();
  return "";
}

function render() {
  const todas = paginas();
  if (paginaAtual < 1) paginaAtual = 1;
  if (paginaAtual > todas.length) paginaAtual = todas.length;

  const livro = document.getElementById("livro");
  const esquerda = document.getElementById("paginaEsquerda");
  const direita = document.getElementById("paginaDireita");

  const atual = pagina(paginaAtual);
  document.getElementById("paginaAtualLabel").textContent = `Página ${paginaAtual} de ${todas.length}`;
  document.getElementById("tituloPagina").textContent = atual.titulo;

  if (paginaAtual === 1) {
    livro.classList.add("capa");
    direita.innerHTML = paginaHTML(atual);
    esquerda.innerHTML = "";
  } else {
    livro.classList.remove("capa");
    const pEsq = pagina(par(paginaAtual));
    const pDir = pagina(par(paginaAtual) + 1);
    esquerda.innerHTML = paginaHTML(pEsq);
    direita.innerHTML = pDir ? paginaHTML(pDir) : "";
  }

  atualizarStatus();
  salvarPagina();
}

function atualizarStatus() {
  const t = totais();

  document.getElementById("totalColadas").textContent = t.coladas;
  document.getElementById("totalDisponiveis").textContent = t.disponiveis;
  document.getElementById("totalPacotes").textContent = estado.pacotes;
  document.getElementById("totalRepetidas").textContent = t.repetidas;
  document.getElementById("pacotesTopo").textContent = estado.pacotes;

  document.getElementById("marcaTitulo").textContent = TEMA.nome || "Cápsula do Tempo Digital";
  document.getElementById("marcaSubtitulo").textContent = TEMA.subtitulo || "Modelo-base editável";
}

function proximaPagina() {
  playSom("pagina");
  paginaAtual = Math.min(totalPaginas(), paginaAtual + (paginaAtual === 1 ? 1 : 2));
  render();
}

function paginaAnterior() {
  playSom("pagina");
  paginaAtual = Math.max(1, paginaAtual - (paginaAtual <= 2 ? 1 : 2));
  render();
}

function abrirPacoteModal() {
  document.getElementById("modalPacote").classList.add("ativo");
  document.getElementById("modalPacote").setAttribute("aria-hidden", "false");
  document.getElementById("resultadoPacote").innerHTML = "";
  document.getElementById("avisoPacote").textContent = estado.pacotes > 0
    ? `Você tem ${estado.pacotes} pacote(s). Cada pacote libera ${FIGS_POR_PACOTE} figurinhas.`
    : "Você não tem pacotes. Faça o quiz ou jogue o game para ganhar.";
}

function fecharPacoteModal() {
  document.getElementById("modalPacote").classList.remove("ativo");
  document.getElementById("modalPacote").setAttribute("aria-hidden", "true");
}

function escolherFigurinhaAleatoria() {
  return FIGURINHAS[Math.floor(Math.random() * FIGURINHAS.length)];
}

function abrirPacote() {
  if (estado.pacotes <= 0) {
    document.getElementById("avisoPacote").textContent = "Sem pacotes disponíveis. Responda o quiz ou jogue o game.";
    return;
  }

  estado.pacotes--;
  const recebidas = [];

  for (let i = 0; i < FIGS_POR_PACOTE; i++) {
    const fig = escolherFigurinhaAleatoria();
    const r = reg(fig.id);
    r.quantidade = (r.quantidade || 0) + 1;
    recebidas.push(fig);
  }

  estado.historico.unshift({
    data: new Date().toISOString(),
    figurinhas: recebidas.map(f => f.numero)
  });

  salvar();
  playSom("pacote");

  document.getElementById("resultadoPacote").innerHTML = recebidas.map(fig => `
    <article class="fig disponivel">
      <div class="arte">
        ${imagemHTML(fig)}
        <span class="estado ok">Recebida</span>
      </div>
      <button class="acao" type="button" onclick="colarFig('${fig.id}')">Colar</button>
    </article>
  `).join("");

  atualizarStatus();
  render();
}

function acaoFig(id) {
  const fig = FIGURINHAS.find(f => f.id === id);
  if (!fig) return;

  const r = reg(id);
  if (r.colada) {
    abrirFicha(id);
    return;
  }

  if ((r.quantidade || 0) > 0) {
    colarFig(id);
    return;
  }

  abrirFichaBloqueada(fig);
}

function colarFig(id) {
  const fig = FIGURINHAS.find(f => f.id === id);
  if (!fig) return;

  const r = reg(id);
  if ((r.quantidade || 0) <= 0) return;

  r.colada = true;
  salvar();
  playSom("colar");
  render();
  abrirFicha(id);
}


function fichaDetalhadaHTML(fig) {
  const ficha = fig.ficha || {};
  const campos = Object.entries(ficha).filter(([chave, valor]) => {
    return valor !== undefined && valor !== null && String(valor).trim() !== "";
  });

  if (!campos.length) {
    return "";
  }

  const rotulosPadrao = {
    nome: "Nome",
    nomeCompleto: "Nome completo",
    apelido: "Apelido",
    titulo: "Título",
    categoria: "Categoria",
    posicao: "Posição",
    camisa: "Camisa",
    time: "Time",
    funcao: "Função",
    data: "Data",
    ano: "Ano",
    temporada: "Temporada",
    local: "Local",
    cidade: "Cidade",
    parentesco: "Parentesco",
    nascimento: "Nascimento",
    falecimento: "Falecimento",
    pessoas: "Pessoas na foto",
    historia: "História",
    biografia: "Biografia",
    curiosidade: "Curiosidade",
    conquista: "Conquista",
    mensagem: "Mensagem",
    patrocinador: "Patrocinador",
    observacao: "Observação",
    audio: "Áudio/Depoimento"
  };

  return `
    <article>
      <h3>Ficha detalhada</h3>
      <div class="ficha-grid">
        ${campos.map(([chave, valor]) => `
          <div class="ficha-campo">
            <span>${safe(rotulosPadrao[chave] || chave.replace(/([A-Z])/g, " $1"))}</span>
            <b>${safe(valor)}</b>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function abrirFicha(id) {
  tocarAudioFichaCraques();
  const fig = FIGURINHAS.find(f => f.id === id);
  if (!fig) return;

  const html = `
    <div class="ficha-rev">
      <div class="ficha-img">${imagemHTML(fig)}</div>
      <div class="ficha-dados">
        <span class="tag">Figurinha ${pad(fig.numero)}</span>
        <h2>${safe(fig.titulo)}</h2>
        <div class="meta">
          <div><span>Tema</span><b>${safe(fig.tema)}</b></div>
          <div><span>Status</span><b>Colada</b></div>
        </div>
        <div class="texto-ficha">
          ${fichaDetalhadaHTML(fig)}
          <article><h3>Descrição</h3><p>${safe(fig.descricao)}</p></article>
          <article><h3>Reflexão</h3><p>${safe(fig.reflexao)}</p></article>
          <article><h3>Ação sugerida</h3><p>${safe(fig.acao)}</p></article>
        </div>
      </div>
    </div>
  `;

  document.getElementById("conteudoFicha").innerHTML = html;
  document.getElementById("modalFicha").classList.add("ativo");
  document.getElementById("modalFicha").setAttribute("aria-hidden", "false");
}

function abrirFichaBloqueada(fig) {
  document.getElementById("conteudoFicha").innerHTML = `
    <div class="bloqueio">
      <div>
        <div class="lock">🔒</div>
        <h2>Figurinha bloqueada</h2>
        <p>Abra pacotes, faça o quiz ou jogue o game para encontrar a figurinha ${pad(fig.numero)}.</p>
      </div>
    </div>
  `;
  document.getElementById("modalFicha").classList.add("ativo");
  document.getElementById("modalFicha").setAttribute("aria-hidden", "false");
}

function fecharFicha() {
  document.getElementById("modalFicha").classList.remove("ativo");
  document.getElementById("modalFicha").setAttribute("aria-hidden", "true");
}

function abrirQuiz() {
  const quiz = TEMA.quiz || { perguntas: [] };
  document.getElementById("quizTitulo").textContent = quiz.titulo || "Quiz";
  document.getElementById("quizDescricao").textContent = quiz.descricao || "";
  document.getElementById("modalQuiz").classList.add("ativo");
  document.getElementById("modalQuiz").setAttribute("aria-hidden", "false");
  if (quizJaFinalizado) { respostasQuiz = {}; quizIndiceAtual = 0; quizJaFinalizado = false; quizSelecaoAtual = null; }
  renderQuiz();
}

function fecharQuiz() {
  document.getElementById("modalQuiz").classList.remove("ativo");
  document.getElementById("modalQuiz").setAttribute("aria-hidden", "true");
}

let respostasQuiz = {};
let quizIndiceAtual = 0;
let quizJaFinalizado = false;
let quizSelecaoAtual = null;

function renderQuiz() {
  const perguntas = TEMA.quiz?.perguntas || [];
  const area = document.getElementById("quizArea");
  if (!area) return;

  if (!perguntas.length) {
    area.innerHTML = `<div class="pergunta-box"><p>Nenhuma pergunta cadastrada.</p></div>`;
    return;
  }

  if (quizJaFinalizado) {
    mostrarResultadoQuiz();
    return;
  }

  if (quizIndiceAtual < 0) quizIndiceAtual = 0;
  if (quizIndiceAtual >= perguntas.length) quizIndiceAtual = perguntas.length - 1;

  const q = perguntas[quizIndiceAtual];
  const selecionada = respostasQuiz[quizIndiceAtual];
  const respondida = selecionada !== undefined;
  const acertou = respondida && Number(selecionada) === Number(q.correta);
  const letras = ["A", "B", "C", "D"];

  area.innerHTML = `
    <div class="pergunta-box quiz-uma-por-vez">
      <div class="quiz-progresso">Questão ${quizIndiceAtual + 1} de ${perguntas.length}</div>
      <h3>${quizIndiceAtual + 1}. ${safe(q.pergunta)}</h3>
      <div class="quiz-opcoes-lista">
        ${(q.opcoes || []).map((op, oi) => {
          let classe = (respondida ? respostasQuiz[quizIndiceAtual] : quizSelecaoAtual) === oi ? "selecionada" : "";
          if (respondida && oi === Number(q.correta)) classe += " correta";
          if (respondida && oi === Number(selecionada) && oi !== Number(q.correta)) classe += " errada";
          return `<button class="quiz-opcao ${classe}" onclick="selecionarOpcaoQuiz(${quizIndiceAtual},${oi})" type="button" ${respondida ? "disabled" : ""}>${letras[oi] || ""}) ${safe(op)}</button>`;
        }).join("")}
      </div>
      <div class="quiz-feedback ${respondida ? (acertou ? "ok" : "erro") : ""}" style="display:${respondida ? "block" : "none"}">
        ${respondida ? (acertou ? "✅ Resposta correta!" : "❌ Resposta incorreta.") : ""}
        ${respondida && q.comentario ? `<br><b>Comentário:</b> ${safe(q.comentario)}` : ""}
      </div>
      <div class="quiz-acoes">
        ${!respondida ? `<button class="btn-dourado" onclick="enviarRespostaQuizAtual()" type="button">Enviar resposta</button>` : ""}
        ${respondida && quizIndiceAtual < perguntas.length - 1 ? `<button class="btn-dourado" onclick="proximaPerguntaQuiz()" type="button">Próxima pergunta</button>` : ""}
        ${respondida && quizIndiceAtual === perguntas.length - 1 ? `<button class="btn-dourado" onclick="finalizarQuiz()" type="button">Ver resultado</button>` : ""}
      </div>
    </div>
  `;
}

function selecionarOpcaoQuiz(qi, oi) {
  if (respostasQuiz[qi] !== undefined) return;
  quizSelecaoAtual = oi;
  renderQuiz();
}

function enviarRespostaQuizAtual() {
  if (quizSelecaoAtual === null || quizSelecaoAtual === undefined) {
    alert("Escolha uma alternativa antes de enviar.");
    return;
  }
  respostasQuiz[quizIndiceAtual] = quizSelecaoAtual;
  quizSelecaoAtual = null;
  renderQuiz();
}

function proximaPerguntaQuiz() {
  const perguntas = TEMA.quiz?.perguntas || [];
  if (quizIndiceAtual < perguntas.length - 1) {
    quizIndiceAtual++;
    quizSelecaoAtual = null;
    renderQuiz();
  }
}

function finalizarQuiz() {
  const perguntas = TEMA.quiz?.perguntas || [];
  if (!perguntas.length) return;
  if (Object.keys(respostasQuiz).length < perguntas.length) {
    alert("Responda todas as perguntas antes de finalizar.");
    return;
  }
  quizJaFinalizado = true;
  mostrarResultadoQuiz(true);
}

function mostrarResultadoQuiz(aplicarRecompensa = false) {
  const perguntas = TEMA.quiz?.perguntas || [];
  const area = document.getElementById("quizArea");
  if (!area) return;

  let acertos = 0;
  perguntas.forEach((q, i) => {
    if (Number(respostasQuiz[i]) === Number(q.correta)) acertos++;
  });

  const recompensa = acertos === perguntas.length
    ? Number(CONFIG.recompensaQuizPerfeito || 3)
    : Number(CONFIG.recompensaQuizParticipacao || 1);

  if (aplicarRecompensa) {
    estado.pacotes += recompensa;
    estado.quizFeitos[new Date().toISOString()] = { acertos, recompensa };
    salvar();
    atualizarStatus();
  }

  area.innerHTML = `
    <div class="pergunta-box quiz-resultado-final">
      <h3>Resultado do quiz</h3>
      <p>Você acertou <b>${acertos}</b> de <b>${perguntas.length}</b> perguntas.</p>
      <p>Recompensa liberada: <b>${recompensa} pacote(s)</b>.</p>
      <button class="btn-dourado" onclick="abrirPacoteGanhoNoQuiz()" type="button">Abrir pacote ganho e colar figurinhas</button>
      <button class="btn-secundario" onclick="reiniciarQuiz()" type="button">Responder novamente</button>
    </div>
  `;
}

function abrirPacoteGanhoNoQuiz() {
  fecharQuiz();
  abrirPacoteModal();
}

function reiniciarQuiz() {
  respostasQuiz = {};
  quizIndiceAtual = 0;
  quizJaFinalizado = false;
  quizSelecaoAtual = null;
  renderQuiz();
}

function setupAudio() {
  const a = TEMA.audio || {};
  audio.fundo = new Audio(a.fundo || "");
  audio.pacote = new Audio(a.pacote || "");
  audio.pagina = new Audio(a.pagina || "");
  audio.colar = new Audio(a.colar || "");
  audio.click = new Audio(a.click || "");

  Object.values(audio).forEach(x => {
    x.preload = "auto";
    x.volume = 0.45;
  });

  audio.fundo.loop = true;
  audio.fundo.volume = 0.22;
  atualizarBotaoAudio();
}

function atualizarBotaoAudio() {
  document.getElementById("btnAudio").textContent = audioAtivo ? "Som: ON" : "Som: OFF";
}

function liberarAudio() {
  if (!audioAtivo || audioLiberado || !audio.fundo) return;
  audioLiberado = true;
  audio.fundo.play().catch(() => { audioLiberado = false; });
}

function playSom(nome) {
  if (!audioAtivo || !audio[nome]) return;
  liberarAudio();
  try {
    audio[nome].currentTime = 0;
    audio[nome].play().catch(() => {});
  } catch (e) {}
}

function alternarAudio() {
  audioAtivo = !audioAtivo;
  if (!audioAtivo && audio.fundo) {
    audio.fundo.pause();
    audio.fundo.currentTime = 0;
    audioLiberado = false;
  } else {
    liberarAudio();
  }
  atualizarBotaoAudio();
}

function irGame() {
  window.location.href = "game/index.html";
}

function receberRecompensaGame() {
  const params = new URLSearchParams(window.location.search);
  const recompensa = Number(params.get("gameReward") || 0);
  if (recompensa > 0) {
    estado.pacotes += recompensa;
    estado.recompensasGame += recompensa;
    salvar();
    history.replaceState({}, document.title, window.location.pathname);
    alert(`Recompensa do game recebida: +${recompensa} pacote(s)!`);
  }
}

document.getElementById("btnCapa").addEventListener("click", () => { paginaAtual = 1; render(); });
document.getElementById("btnQuiz").addEventListener("click", abrirQuiz);
document.getElementById("btnGame").addEventListener("click", irGame);
document.getElementById("btnPacoteTopo").addEventListener("click", abrirPacoteModal);
document.getElementById("btnAbrirTopo").addEventListener("click", abrirPacoteModal);
document.getElementById("btnAbrirLateral").addEventListener("click", abrirPacoteModal);
document.getElementById("btnAbrirPacote").addEventListener("click", abrirPacote);
document.getElementById("fecharPacote").addEventListener("click", fecharPacoteModal);
document.getElementById("fecharFicha").addEventListener("click", fecharFicha);
document.getElementById("fecharQuiz").addEventListener("click", fecharQuiz);
document.getElementById("btnPrev").addEventListener("click", paginaAnterior);
document.getElementById("btnNext").addEventListener("click", proximaPagina);
document.getElementById("btnPrevTopo").addEventListener("click", paginaAnterior);
document.getElementById("btnNextTopo").addEventListener("click", proximaPagina);
document.getElementById("btnAudio").addEventListener("click", alternarAudio);

document.addEventListener("click", () => {
  if (audioAtivo) liberarAudio();
}, { once: true });

setupAudio();
receberRecompensaGame();
render();
