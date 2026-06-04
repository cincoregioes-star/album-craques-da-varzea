
/* =========================================================
   MOBILE LEVE V11 — mostra 12 figurinhas por vez no celular
========================================================= */
(function(){
  const LIMITE_INICIAL = 12;
  const PASSO = 12;
  let limite = LIMITE_INICIAL;

  function isMobile(){
    return window.matchMedia && window.matchMedia("(max-width:820px)").matches;
  }

  function grid(){
    return document.getElementById("gridFigurinhas")
      || document.querySelector("#galeria")
      || document.querySelector(".grid")
      || document.querySelector(".figurinhas-grid")
      || document.querySelector(".grade-figurinhas")
      || document.querySelector(".grid-figurinhas");
  }

  function cards(){
    const g = grid();
    if(!g) return [];
    return Array.from(g.children).filter(el => el.nodeType === 1 && !el.id?.includes("mobile"));
  }

  function garantirControles(){
    const g = grid();
    if(!g || !g.parentNode) return;

    let info = document.getElementById("mobileV11Info");
    if(!info){
      info = document.createElement("div");
      info.id = "mobileV11Info";
      info.className = "mobile-v11-info";
      g.parentNode.insertBefore(info, g);
    }

    let btn = document.getElementById("mobileV11Carregar");
    if(!btn){
      btn = document.createElement("button");
      btn.id = "mobileV11Carregar";
      btn.className = "mobile-v11-carregar";
      btn.type = "button";
      btn.textContent = "Carregar mais figurinhas";
      btn.onclick = function(){
        limite += PASSO;
        aplicar();
      };
      g.parentNode.insertBefore(btn, g.nextSibling);
    }
  }

  function aplicar(){
    const lista = cards();
    if(!lista.length) return;

    if(!isMobile()){
      lista.forEach(c => c.style.display = "");
      const info = document.getElementById("mobileV11Info");
      const btn = document.getElementById("mobileV11Carregar");
      if(info) info.style.display = "none";
      if(btn) btn.style.display = "none";
      return;
    }

    garantirControles();

    lista.forEach((card, idx)=>{
      card.style.display = idx < limite ? "" : "none";
      const img = card.querySelector("img");
      if(img){
        img.loading = "lazy";
        img.decoding = "async";
      }
    });

    const visiveis = Math.min(limite, lista.length);

    const info = document.getElementById("mobileV11Info");
    if(info){
      info.style.display = "block";
      info.textContent = "Mostrando " + visiveis + " de " + lista.length + " figurinhas.";
    }

    const btn = document.getElementById("mobileV11Carregar");
    if(btn){
      btn.style.display = lista.length > limite ? "block" : "none";
    }
  }

  function observar(){
    const g = grid();
    if(!g || g.dataset.mobileV11Obs === "1") return;
    g.dataset.mobileV11Obs = "1";

    const obs = new MutationObserver(()=>{
      setTimeout(aplicar, 80);
    });
    obs.observe(g, {childList:true, subtree:false});
  }

  function start(){
    observar();
    aplicar();
    setTimeout(()=>{observar(); aplicar();}, 500);
    setTimeout(()=>{observar(); aplicar();}, 1500);
  }

  document.addEventListener("DOMContentLoaded", start);
  window.addEventListener("load", start);
  window.addEventListener("resize", aplicar);
  document.addEventListener("click", ()=>setTimeout(start, 200));

  window.mobileV11Resetar = function(){
    limite = LIMITE_INICIAL;
    aplicar();
  };
})();
