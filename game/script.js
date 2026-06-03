
/* Áudio foguete para ações do game — Craques da Várzea */
const AUDIO_FOGUETE_CRAQUES = new Audio("../audio/game/foguete.mp3");
AUDIO_FOGUETE_CRAQUES.volume = 0.65;
function tocarFogueteCraques(){
  try{
    AUDIO_FOGUETE_CRAQUES.currentTime = 0;
    AUDIO_FOGUETE_CRAQUES.play();
  }catch(e){}
}

const pecas = ["⚽","👟","🏆","⭐","🥅","📣","🟨","🟩"];
const tamanho = 8;
let grade = [];
let selecionada = null;
let pontos = 0;
let jogadas = 25;
let fase = 1;
let meta = 800;
let venceu = false;
let audioAtivo = false;

const tabuleiro = document.getElementById("tabuleiro");
const pontosEl = document.getElementById("pontos");
const jogadasEl = document.getElementById("jogadas");
const metaEl = document.getElementById("meta");
const progressoEl = document.getElementById("progresso");
const btnConcluir = document.getElementById("btnConcluir");
const btnAudio = document.getElementById("btnAudio");
const audioMatch = document.getElementById("audioMatch");
const audioVitoria = document.getElementById("audioVitoria");

function sorteia(){return pecas[Math.floor(Math.random()*pecas.length)]}
function idx(r,c){return r*tamanho+c}
function vizinhas(a,b){const ar=Math.floor(a/tamanho), ac=a%tamanho, br=Math.floor(b/tamanho), bc=b%tamanho;return Math.abs(ar-br)+Math.abs(ac-bc)===1}

function novaGrade(){
  grade = Array.from({length:tamanho*tamanho}, sorteia);
  pontos=0; jogadas=25; venceu=false; btnConcluir.disabled=true;
  removerMatchesIniciais();
  render();
}

function removerMatchesIniciais(){
  let matches = encontrarMatches();
  let tentativas = 0;
  while(matches.size && tentativas < 20){
    matches.forEach(i=>grade[i]=sorteia());
    matches = encontrarMatches();
    tentativas++;
  }
}

function render(){
  tabuleiro.innerHTML = grade.map((p,i)=>`<button class="peca ${selecionada===i?'sel':''}" onclick="clicar(${i})" type="button">${p}</button>`).join("");
  pontosEl.textContent = pontos;
  jogadasEl.textContent = jogadas;
  metaEl.textContent = meta;
  progressoEl.style.width = `${Math.min(100,(pontos/meta)*100)}%`;
  if(pontos >= meta && !venceu){
    venceu = true;
    btnConcluir.disabled = false;
    tocar(audioVitoria);
    alert("Fase concluída! Receba sua recompensa no álbum.");
  }
}

function clicar(i){
  if(venceu) return;
  if(selecionada === null){selecionada=i;render();return}
  if(selecionada === i){selecionada=null;render();return}
  if(!vizinhas(selecionada,i)){selecionada=i;render();return}

  trocar(selecionada,i);
  const matches = encontrarMatches();
  if(matches.size){
    jogadas--;
    resolver(matches);
  }else{
    trocar(selecionada,i);
  }
  selecionada=null;
  render();
  if(jogadas<=0 && !venceu){
    alert("Acabaram as jogadas. Reinicie a fase e tente novamente.");
  }
}

function trocar(a,b){const t=grade[a];grade[a]=grade[b];grade[b]=t}

function encontrarMatches(){
  const set = new Set();
  for(let r=0;r<tamanho;r++){
    let seq=[idx(r,0)];
    for(let c=1;c<tamanho;c++){
      const atual=idx(r,c), ant=idx(r,c-1);
      if(grade[atual]===grade[ant]) seq.push(atual);
      else{if(seq.length>=3) seq.forEach(x=>set.add(x)); seq=[atual]}
    }
    if(seq.length>=3) seq.forEach(x=>set.add(x));
  }
  for(let c=0;c<tamanho;c++){
    let seq=[idx(0,c)];
    for(let r=1;r<tamanho;r++){
      const atual=idx(r,c), ant=idx(r-1,c);
      if(grade[atual]===grade[ant]) seq.push(atual);
      else{if(seq.length>=3) seq.forEach(x=>set.add(x)); seq=[atual]}
    }
    if(seq.length>=3) seq.forEach(x=>set.add(x));
  }
  return set;
}

function resolver(matches){
  pontos += matches.size * 40;
  tocar(audioMatch);
  matches.forEach(i=>grade[i]=sorteia());

  setTimeout(()=>{
    const novos = encontrarMatches();
    if(novos.size) resolver(novos);
    else render();
  },120);
}

function tocar(a){
  if(!audioAtivo || !a) return;
  try{a.currentTime=0;a.play().catch(()=>{})}catch(e){}
}

function alternarAudio(){
  audioAtivo=!audioAtivo;
  btnAudio.textContent = audioAtivo ? "Som: ON" : "Som: OFF";
}

function voltar(){
  window.location.href = "../index.html";
}

function recompensa(){
  window.location.href = "../index.html?gameReward=1";
}

document.getElementById("btnReiniciar").addEventListener("click", novaGrade);
document.getElementById("btnEmbaralhar").addEventListener("click", ()=>{grade=grade.map(sorteia);render()});
document.getElementById("btnVoltar").addEventListener("click", voltar);
document.getElementById("btnConcluir").addEventListener("click", recompensa);
btnAudio.addEventListener("click", alternarAudio);

novaGrade();
