
/* ===== MOBILE: ARRASTAR PARA O LADO ===== */
(function(){
  function mobile(){return window.matchMedia && window.matchMedia("(max-width:820px)").matches;}
  function alvo(){
    var sels=[".livro",".album",".paginas",".pages",".spread","#livro","#album","#paginas"];
    for(var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]); if(el) return el;}
    var ps=document.querySelectorAll(".pagina,.page,.folha");
    return ps.length ? ps[0].parentElement : null;
  }
  function aplicar(){
    if(!mobile()) return;
    var album=alvo();
    if(!album || album.dataset.mobileScrollOk==="1") return;
    album.dataset.mobileScrollOk="1";
    var wrapper=document.createElement("div");
    wrapper.className="mobile-scroll-zone";
    album.parentNode.insertBefore(wrapper,album);
    wrapper.appendChild(album);
    album.classList.add("mobile-scroll-track");
    var dica=document.createElement("div");
    dica.className="mobile-dica-arrastar";
    dica.textContent="↔️ Arraste para o lado para ver as páginas e figurinhas";
    wrapper.parentNode.insertBefore(dica,wrapper);
  }
  function reforcar(){aplicar();setTimeout(aplicar,400);setTimeout(aplicar,1200);}
  document.addEventListener("DOMContentLoaded",reforcar);
  window.addEventListener("load",reforcar);
  window.addEventListener("resize",reforcar);
  document.addEventListener("click",function(){setTimeout(aplicar,200);});
})();
