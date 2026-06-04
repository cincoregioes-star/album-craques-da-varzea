
/* =========================================================
   EXPORTADOR HTML LEVE V11
   NÃO contém imagens base64 dentro do GitHub.
   Ele embute as imagens somente na hora em que o usuário exporta.
========================================================= */
(function(){
  function tema(){
    return window.TEMA || window.ALBUM_TEMA || window.DADOS_ALBUM || {};
  }

  function getFigurinhas(){
    if(Array.isArray(window.FIGURINHAS)) return window.FIGURINHAS;
    if(Array.isArray(tema().figurinhas)) return tema().figurinhas;
    return [];
  }

  function p2(n){ return String(n).padStart(2,"0"); }

  function esc(t){
    return String(t ?? "").replace(/[&<>"']/g, s => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"
    }[s]));
  }

  function getCustom(){
    const keys = Object.keys(localStorage).filter(k => k.includes("CLIENTE_OFFLINE") || k.includes("craques") || k.includes("album"));
    for(const k of keys){
      try{
        const obj = JSON.parse(localStorage.getItem(k));
        if(obj && obj.figs) return obj;
        if(obj && obj.custom && obj.custom.figs) return obj.custom;
      }catch(e){}
    }
    return {figs:{},cores:{},audio:{}};
  }

  function customFig(num){
    const c = getCustom();
    return (c.figs && (c.figs[num] || c.figs[String(num)])) || {};
  }

  function srcFig(num){
    const c = customFig(num);
    if(c.img) return c.img;
    if(c.imagem) return c.imagem;
    if(c.foto) return c.foto;
    return "figurinhas/figurinha-" + p2(num) + ".webp";
  }

  function fileToDataURL(blob){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function resizeImage(dataUrl, maxW=420, quality=.72){
    return new Promise(resolve=>{
      if(!dataUrl || !dataUrl.startsWith("data:image")){
        resolve(dataUrl || "");
        return;
      }

      const img = new Image();
      img.onload = ()=>{
        const scale = Math.min(1, maxW / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = ()=>resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async function carregarImagem(src){
    try{
      if(src && src.startsWith("data:image")){
        return await resizeImage(src);
      }
      const res = await fetch(src, {cache:"force-cache"});
      if(!res.ok) return "";
      const blob = await res.blob();
      const data = await fileToDataURL(blob);
      return await resizeImage(data);
    }catch(e){
      return "";
    }
  }

  function quizAtual(){
    const t = tema();
    if(t.quiz) return t.quiz;

    for(const k of Object.keys(localStorage)){
      try{
        const obj = JSON.parse(localStorage.getItem(k));
        if(obj && obj.perguntas && Array.isArray(obj.perguntas)) return obj;
        if(obj && obj.quiz && obj.quiz.perguntas) return obj.quiz;
      }catch(e){}
    }

    return {titulo:"Quiz do Álbum", descricao:"Responda ao quiz.", perguntas:[]};
  }

  function baixar(nome, conteudo){
    const blob = new Blob([conteudo], {type:"text/html;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function htmlFinal(payload){
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(payload.nome)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#050505;color:#fff;font-family:Arial,Helvetica,sans-serif}
header{position:sticky;top:0;background:#000;padding:14px 18px;border-bottom:1px solid #5d4a12;z-index:2}
h1{color:#f5c542;margin:0;font-size:1.35rem}
p{color:#f7e7b0}
main{max-width:1100px;margin:auto;padding:16px}
.hero,.quiz{border:1px solid rgba(245,197,66,.35);border-radius:20px;padding:18px;background:#111;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.card{background:#111;border:1px solid rgba(245,197,66,.28);border-radius:16px;padding:8px}
.card img{width:100%;aspect-ratio:5/8;object-fit:cover;border-radius:12px;background:#fff}
.card h3{font-size:.9rem;color:#f5c542;margin:8px 0 4px}
.card p{font-size:.78rem;margin:0}
.q{padding:12px;border-radius:14px;background:#0b0b0b;margin:10px 0}
.q strong{color:#f5c542}
.q label{display:block;border:1px solid rgba(245,197,66,.2);border-radius:10px;padding:8px;margin:6px 0}
button{border:0;border-radius:999px;background:linear-gradient(135deg,#fff4b8,#f5c542,#c9971a);color:#111;padding:10px 14px;font-weight:900}
.resposta{display:none;margin-top:8px;padding:10px;border-radius:10px}
.ok{display:block;color:#d7ffd7;background:rgba(0,255,0,.1)}
.erro{display:block;color:#ffd2d2;background:rgba(255,0,0,.1)}
@media(max-width:820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.card:nth-child(n+13){display:none}.mostrar .card{display:block!important}}
</style>
</head>
<body>
<header>
<h1>${esc(payload.nome)}</h1>
<p>${esc(payload.subtitulo)}</p>
<button onclick="document.body.classList.add('mostrar')">Mostrar todas as figurinhas</button>
</header>
<main>
<section class="hero"><h2>${esc(payload.nome)}</h2><p>${esc(payload.descricao)}</p></section>
<section class="grid">
${payload.figurinhas.map(f=>`<article class="card"><img src="${f.img}"><h3>${p2(f.numero)} — ${esc(f.titulo)}</h3><p>${esc(f.subtitulo || f.tema || "")}</p></article>`).join("")}
</section>
<section class="quiz"><h2>${esc(payload.quiz.titulo || "Quiz")}</h2><p>${esc(payload.quiz.descricao || "")}</p><div id="qlist"></div></section>
</main>
<script>
const QUIZ = ${JSON.stringify(payload.quiz).replace(/</g,"\\u003c")};
const respostas = {};
function esc(t){return String(t??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[s]))}
function renderQuiz(){
const el=document.getElementById("qlist");
el.innerHTML=(QUIZ.perguntas||[]).map((q,i)=>'<div class="q"><strong>Questão '+(i+1)+': '+esc(q.pergunta)+'</strong>'+q.opcoes.map((op,j)=>'<label><input type="radio" name="q'+i+'" value="'+j+'"> '+String.fromCharCode(65+j)+') '+esc(op)+'</label>').join('')+'<button onclick="responder('+i+')">Enviar resposta</button><div class="resposta" id="r'+i+'"></div></div>').join('');
}
function responder(i){
const q=QUIZ.perguntas[i];const m=document.querySelector('input[name=q'+i+']:checked');const box=document.getElementById('r'+i);
if(!m){box.className='resposta erro';box.textContent='Escolha uma alternativa.';return}
const ok=Number(m.value)===Number(q.correta);box.className='resposta '+(ok?'ok':'erro');box.innerHTML=(ok?'✅ Correto!':'❌ Incorreto.')+(q.comentario?'<br>'+esc(q.comentario):'');
}
renderQuiz();
</script>
</body>
</html>`;
  }

  async function exportarHTMLV11(){
    try{
      const btn = document.activeElement;
      if(btn && btn.tagName === "BUTTON"){
        btn.disabled = true;
        btn.textContent = "Gerando HTML...";
      }

      const t = tema();
      const figs = getFigurinhas();
      const lista = [];

      for(const f of figs){
        const num = Number(f.numero);
        const c = customFig(num);
        const data = await carregarImagem(srcFig(num));

        lista.push({
          numero:num,
          titulo:c.titulo || f.titulo || ("Figurinha " + num),
          subtitulo:c.subtitulo || c.descricao || f.subtitulo || f.descricao || "",
          tema:f.tema || "",
          img:data
        });
      }

      const payload = {
        nome:t.nome || "Craques da Várzea Digital",
        subtitulo:t.subtitulo || "Álbum digital compartilhável",
        descricao:t.descricao || t.chamada || "Álbum digital.",
        quiz:quizAtual(),
        figurinhas:lista
      };

      baixar("album-compartilhavel.html", htmlFinal(payload));

      if(btn && btn.tagName === "BUTTON"){
        btn.disabled = false;
        btn.textContent = "Exportar HTML único completo para WhatsApp";
      }

      alert("HTML gerado: envie album-compartilhavel.html pelo WhatsApp.");
    }catch(err){
      alert("Erro ao exportar HTML: " + (err && err.message ? err.message : err));
    }
  }

  function instalar(){
    // cria botão funcional se a aba compartilhar existir
    const tab = document.getElementById("tab_compartilhar") || document.getElementById("tab_share");
    if(tab && !document.getElementById("btnExportarV11")){
      const box = document.createElement("div");
      box.className = "share-card";
      box.innerHTML = `
        <h3>📱 WhatsApp / Celular</h3>
        <p>Gera um HTML único leve. O GitHub continua usando a pasta figurinhas/.</p>
        <button class="principal gold" id="btnExportarV11" type="button">Exportar HTML único completo para WhatsApp</button>
      `;
      tab.insertBefore(box, tab.firstChild);
      document.getElementById("btnExportarV11").onclick = exportarHTMLV11;
    }

    // sobrescreve possíveis funções antigas
    window.exportarHTML = exportarHTMLV11;
    window.exportarHTMLUnico = exportarHTMLV11;
    window.exportarHTMLCompletoCelular = exportarHTMLV11;
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    instalar();
    setTimeout(instalar,500);
    setTimeout(instalar,1500);
  });
  window.addEventListener("load", instalar);
  document.addEventListener("click", ()=>setTimeout(instalar,200));
})();
