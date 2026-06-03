
/* =========================================================
   CORREÇÃO MOBILE V9.9 — CELULAR REAL
========================================================= */
(function(){
  function isMobile(){
    return window.matchMedia && window.matchMedia("(max-width: 820px)").matches;
  }

  function visivel(el){
    if(!el) return false;
    const s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && el.offsetWidth > 0;
  }

  function encontrarAreaFigurinhas(){
    const seletores = [
      ".figurinhas-grid",
      ".grade-figurinhas",
      ".grid-figurinhas",
      ".figs-grid",
      ".cards-grid",
      ".album-grid",
      ".sticker-grid",
      ".grid"
    ];

    for(const sel of seletores){
      const el = document.querySelector(sel);
      if(el && visivel(el)) return el;
    }

    const card = document.querySelector(".fig, .figurinha, .card-figurinha, .sticker");
    return card ? card.parentElement : null;
  }

  function limparWrappersAntigos(){
    document.querySelectorAll(".mobile-scroll-zone, .mobile-arraste-real-wrap").forEach(wrap=>{
      const track = wrap.querySelector(".mobile-scroll-track, .mobile-arraste-real-track, .livro, .album, .paginas, .pages, .spread");
      if(track && wrap.parentNode){
        wrap.parentNode.insertBefore(track, wrap);
        wrap.remove();
      }
    });

    document.querySelectorAll(".mobile-scroll-track, .mobile-arraste-real-track").forEach(el=>{
      el.classList.remove("mobile-scroll-track", "mobile-arraste-real-track");
      delete el.dataset.mobileScrollOk;
      delete el.dataset.arrasteRealOk;
    });

    document.querySelectorAll(".mobile-dica-arrastar, .mobile-arraste-info, .mobile-arraste-botoes").forEach(el=>el.remove());
  }

  function criarAviso(){
    if(document.getElementById("mobileAvisoV99")) return;
    const alvo = document.querySelector("main") || document.querySelector(".app") || document.body;
    const aviso = document.createElement("div");
    aviso.id = "mobileAvisoV99";
    aviso.className = "mobileAvisoV99";
    aviso.textContent = "📱 Modo celular: role para baixo para ver as páginas e toque nas figurinhas para abrir detalhes.";
    alvo.insertBefore(aviso, alvo.firstChild);
  }

  function criarBotao(){
    if(document.getElementById("mobileIrFigurinhasV99")) return;

    const btn = document.createElement("button");
    btn.id = "mobileIrFigurinhasV99";
    btn.type = "button";
    btn.textContent = "Figurinhas";
    btn.addEventListener("click", ()=>{
      const area = encontrarAreaFigurinhas();
      if(area){
        area.scrollIntoView({behavior:"smooth", block:"start"});
      }else{
        window.scrollTo({top:document.body.scrollHeight / 2, behavior:"smooth"});
      }
    });
    document.body.appendChild(btn);
  }

  function aplicar(){
    if(!isMobile()) return;

    limparWrappersAntigos();
    criarAviso();
    criarBotao();

    document.body.classList.add("modo-celular-v99");

    document.querySelectorAll("img").forEach(img=>{
      img.style.maxWidth = "100%";
    });
  }

  function reforcar(){
    aplicar();
    setTimeout(aplicar, 300);
    setTimeout(aplicar, 1000);
    setTimeout(aplicar, 2000);
  }

  document.addEventListener("DOMContentLoaded", reforcar);
  window.addEventListener("load", reforcar);
  window.addEventListener("resize", reforcar);
  document.addEventListener("click", ()=>setTimeout(aplicar, 250));

  const obs = new MutationObserver(()=>setTimeout(aplicar, 120));
  document.addEventListener("DOMContentLoaded", ()=>{
    try{ obs.observe(document.body, {childList:true, subtree:true}); }catch(e){}
  });
})();
