
/* ===== EXPORTAR HTML ÚNICO COMPLETO PARA WHATSAPP — V8 ===== */
(function(){
  const temaAtual = () => window.TEMA || window.ALBUM_TEMA || {};
  const CUSTOM_KEY = (temaAtual().storageKey || "album") + "_CLIENTE_OFFLINE_V1";
  const QUIZ_KEY = (temaAtual().storageKey || "album") + "_QUIZ_CLIENTE_OFFLINE_V1";
  const DB_NAME = CUSTOM_KEY + "_DB";
  const DB_STORE = "midias";

  function safeJSON(key, fallback){
    try{
      return JSON.parse(localStorage.getItem(key)) || fallback;
    }catch(e){
      return fallback;
    }
  }

  function abrirDB(){
    return new Promise((resolve,reject)=>{
      const req = indexedDB.open(DB_NAME,1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if(!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function dbKeys(db){
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readonly");
      const req = tx.objectStore(DB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function dbGet(db,key){
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readonly");
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function coletarMidiasCliente(){
    const midias = {};
    try{
      const db = await abrirDB();
      const keys = await dbKeys(db);
      for(const key of keys){
        midias[key] = await dbGet(db,key);
      }
    }catch(e){}
    return midias;
  }

  function blobParaDataURL(blob){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function arquivoParaDataURL(url){
    try{
      const res = await fetch(url);
      if(!res.ok) return "";
      const blob = await res.blob();
      return await blobParaDataURL(blob);
    }catch(e){
      return "";
    }
  }

  async function coletarFigurinhasPadrao(figs){
    const padrao = {};
    for(const f of figs){
      const n = String(f.numero).padStart(2,"0");
      const url = `figurinhas/figurinha-${n}.webp`;
      const data = await arquivoParaDataURL(url);
      if(data) padrao["fig-"+n] = data;
    }
    return padrao;
  }

  function baixar(nome, conteudo, tipo="text/html;charset=utf-8"){
    const blob = new Blob([conteudo], {type:tipo});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeScriptJson(obj){
    return JSON.stringify(obj).replace(/</g,"\\u003c");
  }

  function extrairFigurinhas(){
    if(Array.isArray(window.FIGURINHAS) && window.FIGURINHAS.length){
      return window.FIGURINHAS.map(f=>({
        numero:Number(f.numero),
        titulo:f.titulo || `Figurinha ${String(f.numero).padStart(2,"0")}`,
        descricao:f.descricao || "",
        tema:f.tema || "",
        ficha:f.ficha || {}
      }));
    }

    const tema = temaAtual();
    const figs = [];
    let n = 1;

    if(Array.isArray(tema.paginas)){
      tema.paginas.forEach(pg=>{
        if(Array.isArray(pg.itens)){
          pg.itens.forEach(item=>{
            figs.push({
              numero:n,
              titulo:item.titulo || `Figurinha ${String(n).padStart(2,"0")}`,
              descricao:item.descricao || "",
              tema:pg.tema || "",
              ficha:item.ficha || {}
            });
            n++;
          });
        }
      });
    }

    return figs;
  }

  function htmlViewer(payload){
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${payload.titulo || "Álbum Compartilhável"}</title>
<style>
:root{
  --bg:${payload.custom?.cores?.bg || "#050505"};
  --bg2:${payload.custom?.cores?.bg2 || "#111111"};
  --panel:${payload.custom?.cores?.panel || "#0b0b0b"};
  --panel2:${payload.custom?.cores?.panel2 || "#1a1a1a"};
  --gold:${payload.custom?.cores?.gold || "#f5c542"};
  --gold2:${payload.custom?.cores?.gold2 || "#c9971a"};
  --ink:${payload.custom?.cores?.text || "#fffaf0"};
}
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Arial,Helvetica,sans-serif;
  background:radial-gradient(circle at 18% 8%,rgba(245,197,66,.18),transparent 25%),linear-gradient(135deg,var(--bg),var(--bg2),#000);
  color:var(--ink);
}
header{
  position:sticky;
  top:0;
  z-index:10;
  background:rgba(0,0,0,.84);
  backdrop-filter:blur(8px);
  border-bottom:1px solid rgba(245,197,66,.35);
  padding:14px 18px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}
header h1{margin:0;color:var(--gold);font-size:1.25rem}
header p{margin:2px 0 0;color:#f8e7b0;font-size:.88rem}
.btns{display:flex;gap:8px;flex-wrap:wrap}
button{
  border:1px solid rgba(245,197,66,.45);
  background:linear-gradient(180deg,#2b2b2b,#080808);
  color:#fff;
  border-radius:999px;
  padding:9px 13px;
  font-weight:900;
  cursor:pointer;
}
button.gold{
  background:linear-gradient(135deg,#fff4b8,#f5c542,#c9971a);
  color:#111;
}
main{padding:18px;max-width:1180px;margin:auto}
.hero{
  border:1px solid rgba(245,197,66,.38);
  background:linear-gradient(145deg,rgba(20,20,20,.92),rgba(0,0,0,.88));
  border-radius:22px;
  padding:20px;
  margin-bottom:18px;
}
.hero h2{margin:0 0 6px;color:#fff;font-size:1.75rem}
.hero p{margin:0;color:#f8e7b0;line-height:1.45}
.grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
  gap:14px;
}
.fig{
  background:linear-gradient(145deg,var(--panel2),var(--panel));
  border:1px solid rgba(245,197,66,.28);
  border-radius:18px;
  padding:10px;
  cursor:pointer;
  box-shadow:0 12px 30px rgba(0,0,0,.35);
}
.fig img{
  width:100%;
  aspect-ratio:5/8;
  object-fit:cover;
  background:#fff;
  border-radius:12px;
  display:block;
}
.fig strong{
  display:block;
  color:var(--gold);
  margin-top:8px;
  font-size:.86rem;
  line-height:1.2;
}
.fig small{color:#f8e7b0;font-size:.76rem}
.modal{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.78);
  z-index:99;
  display:none;
  align-items:center;
  justify-content:center;
  padding:14px;
}
.modal.ativo{display:flex}
.card{
  width:min(1050px,96vw);
  max-height:94vh;
  overflow:auto;
  background:linear-gradient(145deg,#130a24,#241044 52%,#0b0614);
  border:1px solid rgba(245,197,66,.48);
  border-radius:22px;
  padding:18px;
}
.close{
  float:right;
  width:42px;height:42px;border-radius:50%;
  background:var(--gold);
  color:#111;
  border:0;
  font-size:1.5rem;
}
.det{
  display:grid;
  grid-template-columns:300px 1fr;
  gap:18px;
}
.det img{
  width:100%;
  border-radius:14px;
  background:#fff;
}
.det h2{margin:0 0 8px;color:#fff;font-size:1.8rem}
.meta{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
}
.meta div{
  background:rgba(255,255,255,.06);
  border:1px solid rgba(245,197,66,.20);
  border-radius:12px;
  padding:10px;
  overflow-wrap:anywhere;
}
.meta b{
  display:block;
  color:var(--gold);
  font-size:.75rem;
  text-transform:uppercase;
  margin-bottom:4px;
}
.quiz{
  margin-top:24px;
  border:1px solid rgba(245,197,66,.28);
  border-radius:18px;
  padding:16px;
  background:rgba(255,255,255,.05);
}
.q{
  margin:12px 0;
  padding:12px;
  border-radius:14px;
  background:rgba(0,0,0,.28);
}
.q strong{color:var(--gold)}
.q label{
  display:block;
  padding:8px 10px;
  margin:7px 0;
  border:1px solid rgba(245,197,66,.22);
  border-radius:12px;
  background:rgba(255,255,255,.04);
  cursor:pointer;
}
.q input{margin-right:8px}
.q button{
  margin-top:8px;
}
.resposta{
  display:none;
  margin-top:10px;
  padding:10px;
  border-radius:12px;
  background:rgba(245,197,66,.10);
  border:1px solid rgba(245,197,66,.25);
}
.resposta.ok{display:block;color:#d7ffd7}
.resposta.erro{display:block;color:#ffd2d2}
.placarQuiz{
  margin-top:14px;
  padding:14px;
  border-radius:14px;
  background:rgba(245,197,66,.14);
  border:1px solid rgba(245,197,66,.35);
  color:#fff7d6;
  font-weight:900;
}

.quiz-progresso{
  display:inline-block;
  margin-bottom:10px;
  padding:7px 12px;
  border-radius:999px;
  background:rgba(245,197,66,.14);
  border:1px solid rgba(245,197,66,.35);
  color:var(--gold);
  font-weight:900;
}
.quiz-acoes{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;}
.quiz-premio{
  margin-top:14px;
  padding:14px;
  border:1px solid rgba(245,197,66,.42);
  border-radius:16px;
  background:rgba(245,197,66,.10);
}
.quiz-premio-grid{
  display:grid;
  grid-template-columns:130px 1fr;
  gap:14px;
  align-items:center;
}
.quiz-premio img{width:100%;border-radius:12px;background:#fff;}
.fig.quiz-colada{outline:3px solid var(--gold);}

@media(max-width:800px){
  .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .det{grid-template-columns:1fr}
  .meta{grid-template-columns:1fr}
  header{align-items:flex-start;flex-direction:column}
}
@media(max-width:420px){
  .grid{grid-template-columns:1fr}
}
</style>
</head>
<body>
<header>
  <div>
    <h1>${payload.titulo || "Álbum Digital"}</h1>
    <p>${payload.subtitulo || "Versão compartilhável offline"}</p>
  </div>
  <div class="btns">
    <button class="gold" onclick="window.print()">Imprimir / PDF</button>
    <button onclick="document.getElementById('galeria').scrollIntoView({behavior:'smooth'})">Figurinhas</button>
    <button onclick="document.getElementById('quiz').scrollIntoView({behavior:'smooth'})">Quiz</button>
  </div>
</header>
<main>
  <section class="hero">
    <h2>${payload.titulo || "Álbum Digital"}</h2>
    <p>${payload.chamada || "Álbum digital compartilhável."}</p>
  </section>

  <section class="grid" id="galeria"></section>

  <section class="quiz" id="quiz">
    <h2 id="quizTitulo"></h2>
    <p id="quizDescricao"></p>
    <div id="quizLista"></div>
  </section>
</main>

<section class="modal" id="modal">
  <div class="card">
    <button class="close" onclick="fechar()">×</button>
    <div id="detalhe"></div>
  </div>
</section>

<script>
const PAYLOAD = ${escapeScriptJson(payload)};

function e(t){
  return String(t ?? "").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;"}[s] || s));
}
function p2(n){return String(n).padStart(2,"0")}
function figCustom(num){
  return PAYLOAD.custom?.figs?.[num] || {};
}
function imagem(num){
  const k = "fig-"+p2(num);
  return PAYLOAD.midias?.[k] || PAYLOAD.padrao?.[k] || "";
}
function montar(){
  const grid = document.getElementById("galeria");
  const figs = PAYLOAD.figurinhas || [];
  grid.innerHTML = figs.map(f=>{
    const c = figCustom(f.numero);
    const titulo = c.titulo || f.titulo || ("Figurinha " + p2(f.numero));
    const desc = c.descricao || f.descricao || "";
    const img = imagem(f.numero);
    return '<article class="fig '+(String(f.numero)===String(figurinhaQuizColada)?'quiz-colada':'')+'" onclick="abrir('+f.numero+')">' +
      (img ? '<img src="'+img+'">' : '<div style="aspect-ratio:5/8;background:#fff;border-radius:12px;color:#111;display:grid;place-items:center;font-weight:900">Sem foto</div>') +
      '<strong>'+p2(f.numero)+' — '+e(titulo)+'</strong><small>'+e(desc)+'</small></article>';
  }).join("");

  const q = PAYLOAD.quiz || {};
  document.getElementById("quizTitulo").textContent = q.titulo || "Quiz";
  document.getElementById("quizDescricao").textContent = q.descricao || "";
  renderQuizCompartilhado();
}
function abrir(num){
  const f = (PAYLOAD.figurinhas || []).find(x=>Number(x.numero)===Number(num));
  if(!f) return;
  const c = figCustom(num);
  const ficha = Object.assign({}, f.ficha || {}, c.ficha || {});
  const titulo = c.titulo || f.titulo || ("Figurinha " + p2(num));
  const desc = c.descricao || f.descricao || "";
  const img = imagem(num);

  const campos = Object.entries(ficha).filter(([k,v])=>v !== undefined && v !== null && String(v).trim() !== "");
  document.getElementById("detalhe").innerHTML =
    '<div class="det">' +
      '<div>'+(img?'<img src="'+img+'">':'')+'</div>' +
      '<div><h2>'+e(titulo)+'</h2><p>'+e(desc)+'</p>' +
      '<div class="meta">' + campos.map(([k,v])=>'<div><b>'+e(k)+'</b>'+e(v)+'</div>').join("") + '</div></div>' +
    '</div>';
  document.getElementById("modal").classList.add("ativo");
}
function fechar(){
  document.getElementById("modal").classList.remove("ativo");
}

let quizRespondidas = {};
let quizIndiceAtual = 0;
let quizSelecaoAtual = null;
let quizFinalizado = false;
let figurinhaQuizColada = localStorage.getItem("albumFigurinhaQuizColada") || "";

function renderQuizCompartilhado(){
  const perguntas = (PAYLOAD.quiz && PAYLOAD.quiz.perguntas) || [];
  const box = document.getElementById("quizLista");
  if(!box) return;

  if(!perguntas.length){
    box.innerHTML = '<div class="placarQuiz">Nenhuma pergunta cadastrada.</div>';
    return;
  }

  if(quizFinalizado){
    renderResultadoQuizCompartilhado();
    return;
  }

  const perg = perguntas[quizIndiceAtual];
  const respondida = quizRespondidas[quizIndiceAtual] !== undefined;
  const selecionada = respondida ? quizRespondidas[quizIndiceAtual] : quizSelecaoAtual;
  const acertou = respondida && Number(selecionada) === Number(perg.correta);
  const letras = ["A","B","C","D"];
  const ops = perg.opcoes || [];

  box.innerHTML = '<div class="q">' +
    '<div class="quiz-progresso">Questão '+(quizIndiceAtual+1)+' de '+perguntas.length+'</div>' +
    '<strong>Questão '+(quizIndiceAtual+1)+': '+e(perg.pergunta)+'</strong><br>' +
    ops.map((op,i)=>{
      let cls = selecionada === i ? ' selecionada' : '';
      if(respondida && i === Number(perg.correta)) cls += ' correta';
      if(respondida && i === Number(selecionada) && i !== Number(perg.correta)) cls += ' errada';
      return '<label class="quiz-opcao'+cls+'" onclick="selecionarOpcaoQuiz('+i+')"><input type="radio" name="quiz_atual" '+(selecionada===i?'checked':'')+' '+(respondida?'disabled':'')+'> '+letras[i]+') '+e(op)+'</label>';
    }).join('') +
    '<div class="resposta '+(respondida ? (acertou ? 'ok' : 'erro') : '')+'">'+
      (respondida ? (acertou ? '✅ Resposta correta!' : '❌ Resposta incorreta.') : '')+
      (respondida && perg.comentario ? '<br><b>Comentário:</b> '+e(perg.comentario) : '')+
    '</div>'+
    '<div class="quiz-acoes">'+
      (!respondida ? '<button class="gold" onclick="enviarRespostaAtual()">Enviar resposta</button>' : '')+
      (respondida && quizIndiceAtual < perguntas.length-1 ? '<button class="gold" onclick="proximaPerguntaQuiz()">Próxima pergunta</button>' : '')+
      (respondida && quizIndiceAtual === perguntas.length-1 ? '<button class="gold" onclick="finalizarQuizCompartilhado()">Ver resultado</button>' : '')+
    '</div>'+
  '</div>'+
  '<div class="placarQuiz">Respondidas: '+Object.keys(quizRespondidas).length+'/'+perguntas.length+'</div>';
}

function selecionarOpcaoQuiz(i){
  if(quizRespondidas[quizIndiceAtual] !== undefined) return;
  quizSelecaoAtual = i;
  renderQuizCompartilhado();
}

function enviarRespostaAtual(){
  if(quizSelecaoAtual === null || quizSelecaoAtual === undefined){
    alert('Escolha uma alternativa antes de enviar.');
    return;
  }
  quizRespondidas[quizIndiceAtual] = quizSelecaoAtual;
  quizSelecaoAtual = null;
  renderQuizCompartilhado();
}

function proximaPerguntaQuiz(){
  const perguntas = (PAYLOAD.quiz && PAYLOAD.quiz.perguntas) || [];
  if(quizIndiceAtual < perguntas.length-1){
    quizIndiceAtual++;
    quizSelecaoAtual = null;
    renderQuizCompartilhado();
  }
}

function finalizarQuizCompartilhado(){
  quizFinalizado = true;
  renderResultadoQuizCompartilhado();
}

function figurinhaPremioQuiz(){
  const figs = PAYLOAD.figurinhas || [];
  return figs.find(f=>Number(f.numero)===72) || figs[figs.length-1] || figs[0];
}

function renderResultadoQuizCompartilhado(){
  const perguntas = (PAYLOAD.quiz && PAYLOAD.quiz.perguntas) || [];
  let acertos = 0;
  perguntas.forEach((p,i)=>{ if(Number(quizRespondidas[i]) === Number(p.correta)) acertos++; });
  const f = figurinhaPremioQuiz();
  const img = f ? imagem(f.numero) : '';
  const titulo = f ? (figCustom(f.numero).titulo || f.titulo || ('Figurinha '+p2(f.numero))) : 'Figurinha especial';
  document.getElementById("quizLista").innerHTML =
    '<div class="placarQuiz">Resultado: '+acertos+'/'+perguntas.length+' acertos.</div>'+
    '<div class="quiz-premio">'+
      '<h3>Figurinha especial liberada pelo quiz</h3>'+
      '<div class="quiz-premio-grid">'+
        '<div>'+(img ? '<img src="'+img+'">' : '<div style="aspect-ratio:5/8;background:#fff;border-radius:12px;color:#111;display:grid;place-items:center;font-weight:900">Sem foto</div>')+'</div>'+
        '<div><b>'+e(titulo)+'</b><p>Agora você pode colar esta figurinha no álbum compartilhável.</p>'+
        '<button class="gold" onclick="colarFigurinhaQuiz()">Colar figurinha no álbum</button> '+
        '<button onclick="reiniciarQuizCompartilhado()">Responder novamente</button></div>'+
      '</div>'+
    '</div>';
}

function colarFigurinhaQuiz(){
  const f = figurinhaPremioQuiz();
  if(!f) return;
  figurinhaQuizColada = String(f.numero);
  localStorage.setItem("albumFigurinhaQuizColada", figurinhaQuizColada);
  montar();
  document.getElementById('galeria').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>abrir(f.numero), 500);
}

function reiniciarQuizCompartilhado(){
  quizRespondidas = {};
  quizIndiceAtual = 0;
  quizSelecaoAtual = null;
  quizFinalizado = false;
  renderQuizCompartilhado();
}

montar();
</script>
</body>
</html>`;
  }

  async function exportarHTMLUnico(){
    try{
      const tema = temaAtual();
      const custom = safeJSON(CUSTOM_KEY, {figs:{},cores:{},audio:{}});
      const quiz = safeJSON(QUIZ_KEY, tema.quiz || {});
      const midiasCliente = await coletarMidiasCliente();
      const figs = extrairFigurinhas();
      const padrao = await coletarFigurinhasPadrao(figs);

      const payload = {
        tipo:"album-html-unico-compartilhavel-v8",
        titulo: tema.nome || "Craques da Várzea Digital",
        subtitulo: tema.subtitulo || "Versão compartilhável offline",
        chamada: tema.chamada || "Álbum digital compartilhável.",
        data:new Date().toISOString(),
        custom,
        quiz,
        midias: midiasCliente,
        padrao,
        figurinhas:figs
      };

      const html = htmlViewer(payload);
      baixar("album-compartilhavel.html", html, "text/html;charset=utf-8");

      if(typeof avisoShare === "function"){
        avisoShare("HTML completo exportado. Envie album-compartilhavel.html pelo WhatsApp.");
      }else{
        alert("HTML completo exportado. Envie album-compartilhavel.html pelo WhatsApp.");
      }
    }catch(err){
      alert("Erro ao exportar HTML completo: " + (err && err.message ? err.message : err));
    }
  }

  function adicionarBotao(){
    const tab = document.getElementById("tab_compartilhar");
    if(!tab) return false;
    if(document.getElementById("btnExportarHTMLUnico")) return true;

    const card = document.createElement("div");
    card.className = "share-card";
    card.innerHTML = `
      <h3>📱 Exportar HTML único completo para WhatsApp</h3>
      <p>Gera um arquivo único chamado <b>album-compartilhavel.html</b>, já com figurinhas, textos, ficha e quiz. Esse é o melhor modo para enviar pelo WhatsApp.</p>
      <div class="editor-actions">
        <button class="principal" id="btnExportarHTMLUnico" type="button">Exportar HTML único completo</button>
      </div>
    `;
    const box = tab.querySelector(".share-box");
    if(box) box.insertBefore(card, box.firstChild);
    else tab.appendChild(card);

    document.getElementById("btnExportarHTMLUnico").onclick = exportarHTMLUnico;
    return true;
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    let tentativas = 0;
    const timer = setInterval(()=>{
      tentativas++;
      if(adicionarBotao() || tentativas > 40) clearInterval(timer);
    },250);
  });
})();
