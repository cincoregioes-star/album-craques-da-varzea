
/* ===== MOBILE ARRASTE REAL V9.6 ===== */
(function(){
  function isMobile(){
    return window.matchMedia && window.matchMedia("(max-width:820px)").matches;
  }

  function visible(el){
    if(!el) return false;
    var s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  function findTrack(){
    var selectors = [
      ".livro",
      ".album",
      ".paginas",
      ".pages",
      ".spread",
      "#livro",
      "#album",
      "#paginas",
      ".mobile-carousel-track",
      ".carrossel-track",
      ".carousel-track"
    ];

    for(var i=0;i<selectors.length;i++){
      var el = document.querySelector(selectors[i]);
      if(el && visible(el)) return el;
    }

    var paginas = Array.from(document.querySelectorAll(".pagina,.page,.folha"));
    if(paginas.length){
      var parent = paginas[0].parentElement;
      if(parent) return parent;
    }

    return null;
  }

  function unwrapOld(track){
    if(!track) return track;
    var old = track.closest(".mobile-scroll-zone");
    if(old && old.parentNode){
      old.parentNode.insertBefore(track, old);
      old.remove();
    }
    return track;
  }

  function apply(){
    if(!isMobile()) return;

    var track = findTrack();
    if(!track) return;

    track = unwrapOld(track);

    if(track.dataset.arrasteRealOk === "1") return;
    track.dataset.arrasteRealOk = "1";

    var wrap = document.createElement("div");
    wrap.className = "mobile-arraste-real-wrap";

    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);

    track.classList.add("mobile-arraste-real-track");

    var info = document.createElement("div");
    info.className = "mobile-arraste-info";
    info.innerHTML = "↔️ Arraste esta área para o lado ou use os botões abaixo";
    wrap.parentNode.insertBefore(info, wrap);

    var botoes = document.createElement("div");
    botoes.className = "mobile-arraste-botoes";
    botoes.innerHTML = '<button type="button" data-dir="-1">◀ Página</button><button type="button" data-dir="1">Página ▶</button>';
    wrap.parentNode.insertBefore(botoes, wrap.nextSibling);

    botoes.addEventListener("click", function(ev){
      var btn = ev.target.closest("button");
      if(!btn) return;
      var dir = Number(btn.dataset.dir || 1);
      wrap.scrollBy({left: dir * Math.round(window.innerWidth * 0.92), behavior:"smooth"});
    });

    // Drag com dedo/mouse garantido
    var isDown = false;
    var startX = 0;
    var scrollLeft = 0;

    wrap.addEventListener("pointerdown", function(e){
      isDown = true;
      startX = e.clientX;
      scrollLeft = wrap.scrollLeft;
      wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener("pointermove", function(e){
      if(!isDown) return;
      var dx = e.clientX - startX;
      if(Math.abs(dx) > 4){
        wrap.scrollLeft = scrollLeft - dx;
      }
    });

    wrap.addEventListener("pointerup", function(e){
      isDown = false;
      try{ wrap.releasePointerCapture && wrap.releasePointerCapture(e.pointerId); }catch(err){}
    });

    wrap.addEventListener("pointercancel", function(){
      isDown = false;
    });
  }

  function force(){
    apply();
    setTimeout(apply,300);
    setTimeout(apply,900);
    setTimeout(apply,1600);
  }

  document.addEventListener("DOMContentLoaded", force);
  window.addEventListener("load", force);
  window.addEventListener("resize", force);

  document.addEventListener("click", function(){
    setTimeout(force,120);
  });

  // Observa renderizações dinâmicas do álbum
  var obs = new MutationObserver(function(){
    setTimeout(apply,100);
  });
  document.addEventListener("DOMContentLoaded", function(){
    try{ obs.observe(document.body, {childList:true, subtree:true}); }catch(e){}
  });
})();
