
/* ===== COMPARTILHAR CELULAR CORRIGIDO V9.7 ===== */
(function(){
  function corrigirCompartilhar(){
    const tab = document.getElementById("tab_compartilhar");
    if(!tab || tab.dataset.compartilharCorrigido === "1") return false;
    tab.dataset.compartilharCorrigido = "1";

    const box = tab.querySelector(".share-box") || tab;

    const aviso = document.createElement("div");
    aviso.className = "editor-aviso";
    aviso.innerHTML = "<b>Para enviar pelo WhatsApp/celular:</b> use o botão <b>Exportar HTML único completo</b>. O arquivo JSON é só backup/importação.";

    const card = document.createElement("div");
    card.className = "share-card";
    card.innerHTML = `
      <h3>📱 Enviar para celular / WhatsApp</h3>
      <p>Este é o botão correto para compartilhar. Ele gera um arquivo <b>album-compartilhavel.html</b> que a pessoa abre direto no navegador.</p>
      <div class="editor-actions">
        <button class="principal" id="btnHTMLCelularCorrigido" type="button">Exportar HTML único completo para WhatsApp</button>
      </div>
    `;

    box.insertBefore(card, box.firstChild);
    box.insertBefore(aviso, card);

    const btn = document.getElementById("btnHTMLCelularCorrigido");
    btn.onclick = function(){
      const btnOriginal = document.getElementById("btnExportarHTMLUnico");
      if(btnOriginal){
        btnOriginal.click();
      }else{
        alert("O exportador HTML não foi encontrado nesta versão. Use a versão v8/v10 ou peça para gerar nova versão completa.");
      }
    };

    // Renomeia visualmente botões antigos para não confundir
    const exportJson = document.getElementById("btnExportarVisualizacao");
    if(exportJson){
      exportJson.textContent = "Exportar JSON para backup/importação";
    }

    const cards = tab.querySelectorAll(".share-card");
    cards.forEach(c=>{
      if(c.textContent.includes("Exportar álbum para compartilhar") && !c.textContent.includes("HTML")){
        const h = c.querySelector("h3");
        if(h) h.textContent = "📦 Backup JSON / Importação";
        const p = c.querySelector("p");
        if(p) p.textContent = "Gera arquivo JSON. Não é para abrir direto no WhatsApp. Serve para backup ou importação dentro do álbum.";
      }
    });

    return true;
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    let tentativas = 0;
    const timer = setInterval(()=>{
      tentativas++;
      if(corrigirCompartilhar() || tentativas > 50) clearInterval(timer);
    },250);
  });

  document.addEventListener("click", ()=>{
    setTimeout(corrigirCompartilhar,200);
  });
})();
