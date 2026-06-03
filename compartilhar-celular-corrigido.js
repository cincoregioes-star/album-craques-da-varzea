/* CORREÇÃO V9.8 — BOTÃO COMPARTILHAR CELULAR
   Substitua somente este arquivo no GitHub: compartilhar-celular-corrigido.js */
(function(){
  const temaAtual=()=>window.TEMA||window.ALBUM_TEMA||{};
  const CUSTOM_KEY=(temaAtual().storageKey||'album')+'_CLIENTE_OFFLINE_V1';
  const QUIZ_KEY=(temaAtual().storageKey||'album')+'_QUIZ_CLIENTE_OFFLINE_V1';
  const DB_NAME=CUSTOM_KEY+'_DB';
  const DB_STORE='midias';

  function aviso(msg){
    let b=document.getElementById('shareAvisoV98');
    if(!b){
      b=document.createElement('div');
      b.id='shareAvisoV98';
      b.style.cssText='position:fixed;right:18px;bottom:18px;background:linear-gradient(135deg,#fff4b8,#f5c542,#c9971a);color:#111;padding:14px 18px;border-radius:16px;font-weight:900;z-index:999999;box-shadow:0 12px 36px rgba(0,0,0,.45);max-width:90vw';
      document.body.appendChild(b);
    }
    b.textContent=msg;b.style.display='block';
    clearTimeout(window.__shareAvisoV98Timer);
    window.__shareAvisoV98Timer=setTimeout(()=>b.style.display='none',3600);
  }
  function safeJSON(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch(e){return f}}
  function abrirDB(){return new Promise((ok,fail)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)})}
  function dbKeys(db){return new Promise((ok,fail)=>{const tx=db.transaction(DB_STORE,'readonly');const r=tx.objectStore(DB_STORE).getAllKeys();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>fail(r.error)})}
  function dbGet(db,k){return new Promise((ok,fail)=>{const tx=db.transaction(DB_STORE,'readonly');const r=tx.objectStore(DB_STORE).get(k);r.onsuccess=()=>ok(r.result||null);r.onerror=()=>fail(r.error)})}
  async function midiasCliente(){const m={};try{const db=await abrirDB();for(const k of await dbKeys(db))m[k]=await dbGet(db,k)}catch(e){}return m}
  function blobDataURL(blob){return new Promise((ok,fail)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>fail(r.error);r.readAsDataURL(blob)})}
  async function arquivoDataURL(url){try{const r=await fetch(url);if(!r.ok)return'';return await blobDataURL(await r.blob())}catch(e){return''}}
  function figs(){
    if(Array.isArray(window.FIGURINHAS)&&window.FIGURINHAS.length)return window.FIGURINHAS.map(f=>({numero:Number(f.numero),titulo:f.titulo||('Figurinha '+String(f.numero).padStart(2,'0')),descricao:f.descricao||'',tema:f.tema||'',ficha:f.ficha||{}}));
    const t=temaAtual(), out=[];let n=1;
    if(Array.isArray(t.paginas))t.paginas.forEach(pg=>{if(Array.isArray(pg.itens))pg.itens.forEach(it=>out.push({numero:n++,titulo:it.titulo||('Figurinha '+String(n-1).padStart(2,'0')),descricao:it.descricao||'',tema:pg.tema||'',ficha:it.ficha||{}}))});
    return out;
  }
  async function imagensPadrao(lista){const p={};for(const f of lista){const n=String(f.numero).padStart(2,'0');const d=await arquivoDataURL('figurinhas/figurinha-'+n+'.webp');if(d)p['fig-'+n]=d}return p}
  function baixar(nome,html){const blob=new Blob([html],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
  function esc(s){return String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]))}
  function escJSON(o){return JSON.stringify(o).replace(/</g,'\\u003c')}

  function htmlFinal(payload){return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(payload.titulo)}</title><style>
*{box-sizing:border-box}body{margin:0;font-family:Arial;background:#050505;color:#fff}header{position:sticky;top:0;background:#080808;border-bottom:1px solid #c9971a;padding:14px;z-index:2}h1{color:#f5c542;margin:0 0 4px}.sub{color:#f8e7b0;margin:0 0 12px}.btn{display:flex;gap:8px;flex-wrap:wrap}button{border:1px solid #c9971a;background:#111;color:#fff;border-radius:999px;padding:10px 14px;font-weight:900}.gold{background:linear-gradient(135deg,#fff4b8,#f5c542,#c9971a);color:#111}main{padding:16px;max-width:1100px;margin:auto}.hero,.quiz{border:1px solid rgba(245,197,66,.35);border-radius:20px;padding:18px;background:#111;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.fig{background:#151515;border:1px solid rgba(245,197,66,.28);border-radius:16px;padding:9px}.fig img{width:100%;aspect-ratio:5/8;object-fit:cover;border-radius:10px;background:#fff}.fig b{display:block;color:#f5c542;margin-top:7px}.fig small{color:#f8e7b0}.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9;padding:12px;align-items:center;justify-content:center}.modal.on{display:flex}.card{background:#160b29;border:1px solid #c9971a;border-radius:20px;max-width:950px;max-height:92vh;overflow:auto;padding:16px}.close{float:right;background:#f5c542;color:#111;border:0;border-radius:50%;width:42px;height:42px}.det{display:grid;grid-template-columns:280px 1fr;gap:16px}.det img{width:100%;border-radius:12px;background:#fff}.meta{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.meta div{background:rgba(255,255,255,.06);border-radius:10px;padding:9px}.meta b{display:block;color:#f5c542;text-transform:uppercase;font-size:.75rem}.q{background:#090909;border-radius:14px;padding:12px;margin:12px 0}.q strong{color:#f5c542}.q label{display:block;border:1px solid rgba(245,197,66,.22);border-radius:10px;padding:8px;margin:7px 0}.resp{display:none;margin-top:10px;padding:10px;border-radius:10px;background:rgba(245,197,66,.12)}.resp.ok{display:block;color:#caffca}.resp.erro{display:block;color:#ffd0d0}.placar{padding:12px;background:rgba(245,197,66,.14);border-radius:12px;font-weight:900;color:#fff7d6}@media(max-width:700px){.grid{grid-template-columns:repeat(2,1fr)}.det{grid-template-columns:1fr}.meta{grid-template-columns:1fr}}@media(max-width:420px){.grid{grid-template-columns:1fr}}
</style></head><body><header><h1>${esc(payload.titulo)}</h1><p class="sub">${esc(payload.subtitulo)}</p><div class="btn"><button class="gold" onclick="window.print()">Imprimir / PDF</button><button onclick="document.getElementById('galeria').scrollIntoView({behavior:'smooth'})">Figurinhas</button><button onclick="document.getElementById('quiz').scrollIntoView({behavior:'smooth'})">Quiz</button></div></header><main><section class="hero"><h2>${esc(payload.titulo)}</h2><p>${esc(payload.chamada)}</p></section><section class="grid" id="galeria"></section><section class="quiz" id="quiz"><h2 id="qt"></h2><p id="qd"></p><div id="ql"></div></section></main><section class="modal" id="modal"><div class="card"><button class="close" onclick="fechar()">×</button><div id="detalhe"></div></div></section><script>const P=${escJSON(payload)};const R={};function e(t){return String(t??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}function p2(n){return String(n).padStart(2,'0')}function c(n){return P.custom&&P.custom.figs?(P.custom.figs[n]||{}):{}}function img(n){const k='fig-'+p2(n);return(P.midias&&P.midias[k])||(P.padrao&&P.padrao[k])||''}function montar(){document.getElementById('galeria').innerHTML=(P.figurinhas||[]).map(f=>{const x=c(f.numero),t=x.titulo||f.titulo||('Figurinha '+p2(f.numero)),d=x.descricao||f.descricao||'',im=img(f.numero);return '<article class="fig" onclick="abrir('+f.numero+')">'+(im?'<img src="'+im+'">':'<div style="aspect-ratio:5/8;background:#fff;color:#111;display:grid;place-items:center;border-radius:10px;font-weight:900">Sem foto</div>')+'<b>'+p2(f.numero)+' — '+e(t)+'</b><small>'+e(d)+'</small></article>'}).join('');const q=P.quiz||{};qt.textContent=q.titulo||'Quiz';qd.textContent=q.descricao||'';ql.innerHTML=(q.perguntas||[]).map((perg,i)=>'<div class="q"><strong>Questão '+(i+1)+': '+e(perg.pergunta)+'</strong>'+((perg.opcoes||[]).map((op,j)=>'<label><input type="radio" name="q'+i+'" value="'+j+'"> '+['A','B','C','D'][j]+') '+e(op)+'</label>').join(''))+'<button class="gold" onclick="resp('+i+')">Enviar resposta</button><div class="resp" id="r'+i+'"></div></div>').join('')+'<div class="placar" id="placar">Responda ao quiz para ver sua pontuação.</div>'}function abrir(n){const f=(P.figurinhas||[]).find(x=>+x.numero===+n);if(!f)return;const x=c(n),fi=Object.assign({},f.ficha||{},x.ficha||{}),t=x.titulo||f.titulo,d=x.descricao||f.descricao,im=img(n),cam=Object.entries(fi).filter(y=>y[1]!=null&&String(y[1]).trim()!=='');detalhe.innerHTML='<div class="det"><div>'+(im?'<img src="'+im+'">':'')+'</div><div><h2>'+e(t)+'</h2><p>'+e(d)+'</p><div class="meta">'+cam.map(y=>'<div><b>'+e(y[0])+'</b>'+e(y[1])+'</div>').join('')+'</div></div></div>';modal.classList.add('on')}function fechar(){modal.classList.remove('on')}function resp(i){const q=(P.quiz&&P.quiz.perguntas)||[],perg=q[i],m=document.querySelector('input[name="q'+i+'"]:checked'),b=document.getElementById('r'+i);if(!m){b.className='resp erro';b.innerHTML='Escolha uma alternativa antes de enviar.';return}const ok=+m.value===+perg.correta;R[i]=ok;b.className='resp '+(ok?'ok':'erro');b.innerHTML=(ok?'✅ Resposta correta!':'❌ Resposta incorreta.')+(perg.comentario?'<br><b>Comentário:</b> '+e(perg.comentario):'');placarQuiz()}function placarQuiz(){const total=((P.quiz&&P.quiz.perguntas)||[]).length,respondidas=Object.keys(R).length,acertos=Object.values(R).filter(Boolean).length;let msg='Respondidas: '+respondidas+'/'+total+' • Acertos: '+acertos;if(total&&respondidas===total)msg+=acertos===total?' • Parabéns! Você gabaritou e ganhou 3 pacotes.':' • Você participou e ganhou 1 pacote.';placar.textContent=msg}montar();<\/script></body></html>`}

  async function exportar(){
    try{
      aviso('Gerando HTML completo. Aguarde...');
      const tema=temaAtual();
      const lista=figs();
      const payload={tipo:'album-html-v98',titulo:tema.nome||'Craques da Várzea Digital',subtitulo:tema.subtitulo||'Versão compartilhável offline',chamada:tema.chamada||'Álbum digital compartilhável.',custom:safeJSON(CUSTOM_KEY,{figs:{},cores:{},audio:{}}),quiz:safeJSON(QUIZ_KEY,tema.quiz||{}),midias:await midiasCliente(),padrao:await imagensPadrao(lista),figurinhas:lista};
      baixar('album-compartilhavel.html',htmlFinal(payload));
      aviso('HTML gerado. Envie album-compartilhavel.html pelo WhatsApp.');
    }catch(err){alert('Erro ao exportar HTML completo: '+(err&&err.message?err.message:err))}
  }

  function corrigir(){
    const tab=document.getElementById('tab_compartilhar');
    if(!tab)return false;
    const box=tab.querySelector('.share-box')||tab;
    if(!document.getElementById('btnHTMLCelularCorrigido')){
      const avisoBox=document.createElement('div');avisoBox.className='editor-aviso';avisoBox.innerHTML='<b>Para WhatsApp/celular:</b> use o botão abaixo. JSON é apenas backup/importação.';
      const card=document.createElement('div');card.className='share-card';card.innerHTML='<h3>📱 Enviar para celular / WhatsApp</h3><p>Gera o arquivo <b>album-compartilhavel.html</b>. A pessoa abre direto no navegador.</p><div class="editor-actions"><button class="principal" id="btnHTMLCelularCorrigido" type="button">Exportar HTML único completo para WhatsApp</button></div>';
      box.insertBefore(card,box.firstChild);box.insertBefore(avisoBox,card);
    }
    const btn=document.getElementById('btnHTMLCelularCorrigido');
    if(btn&&btn.dataset.ok!=='1'){btn.dataset.ok='1';btn.onclick=exportar}
    const jsonBtn=document.getElementById('btnExportarVisualizacao');
    if(jsonBtn)jsonBtn.textContent='Exportar JSON para backup/importação';
    return true;
  }
  document.addEventListener('DOMContentLoaded',()=>{let t=0;const timer=setInterval(()=>{t++;if(corrigir()||t>60)clearInterval(timer)},250)});
  document.addEventListener('click',()=>setTimeout(corrigir,200));
})();
