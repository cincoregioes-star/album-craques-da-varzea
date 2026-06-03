
/* ===== COMPARTILHAR ÁLBUM OFFLINE — V6 ===== */
(function(){
  const SHARE_KEY = ((window.TEMA && TEMA.storageKey) || (window.ALBUM_TEMA && ALBUM_TEMA.storageKey) || "album") + "_CLIENTE_OFFLINE_V1";
  const QUIZ_KEY = ((window.TEMA && TEMA.storageKey) || (window.ALBUM_TEMA && ALBUM_TEMA.storageKey) || "album") + "_QUIZ_CLIENTE_OFFLINE_V1";
  const DB_NAME = SHARE_KEY + "_DB";
  const DB_STORE = "midias";

  function baixar(nome, conteudo, tipo="application/json"){
    const blob = new Blob([conteudo], {type:tipo});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
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

  function lerJSONLocal(key, fallback){
    try{
      const v = JSON.parse(localStorage.getItem(key));
      return v || fallback;
    }catch(e){
      return fallback;
    }
  }

  async function montarPacoteCompartilhamento(modo){
    const db = await abrirDB();
    const keys = await dbKeys(db);
    const midias = {};
    for(const key of keys){
      midias[key] = await dbGet(db,key);
    }

    return {
      tipo: "album-capsula-tempo-compartilhavel",
      modo: modo || "visualizacao",
      produto: (window.TEMA && TEMA.nome) || "Álbum Digital",
      data: new Date().toISOString(),
      instrucoes: "Para visualizar em outro aparelho: abra o index.html do álbum, clique em Montar Álbum > Compartilhar/Backup > Importar backup/arquivo, selecione este JSON e recarregue a página.",
      custom: lerJSONLocal(SHARE_KEY, {figs:{},cores:{},audio:{}}),
      quiz: lerJSONLocal(QUIZ_KEY, null),
      midias
    };
  }

  async function exportarVisualizacao(){
    try{
      const pacote = await montarPacoteCompartilhamento("visualizacao");
      baixar("album-para-compartilhar-visualizacao.json", JSON.stringify(pacote,null,2));
      avisoShare("Arquivo de visualização exportado. Envie este JSON junto com a pasta do álbum para o time.");
    }catch(err){
      alert("Erro ao exportar álbum: " + (err && err.message ? err.message : err));
    }
  }

  async function exportarEditavel(){
    try{
      const pacote = await montarPacoteCompartilhamento("editavel");
      baixar("backup-album-editavel.json", JSON.stringify(pacote,null,2));
      avisoShare("Backup editável exportado com sucesso.");
    }catch(err){
      alert("Erro ao exportar backup: " + (err && err.message ? err.message : err));
    }
  }

  function avisoShare(msg){
    let box = document.getElementById("shareAvisoOffline");
    if(!box){
      box = document.createElement("div");
      box.id = "shareAvisoOffline";
      box.style.cssText = "position:fixed;right:24px;bottom:24px;background:linear-gradient(135deg,#fff4b8,#f5c542,#c9971a);color:#111;padding:14px 18px;border-radius:16px;font-weight:900;z-index:999999;box-shadow:0 12px 36px rgba(0,0,0,.45);";
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.display = "block";
    clearTimeout(window.__shareAvisoTimer);
    window.__shareAvisoTimer = setTimeout(()=>{ box.style.display="none"; }, 3500);
  }

  function montarHTMLShare(){
    return `
      <div class="editor-aviso">
        Como este produto é offline, o compartilhamento correto é enviar a pasta do álbum + o arquivo de compartilhamento.
      </div>

      <div class="share-box">
        <div class="share-card">
          <h3>📤 Exportar álbum para compartilhar</h3>
          <p>Gera um arquivo JSON com as fotos, textos, cores, música e quiz editados. Esse arquivo pode ser enviado para jogadores, torcida, família e patrocinadores junto com a pasta do álbum.</p>
          <div class="editor-actions">
            <button class="principal" id="btnExportarVisualizacao" type="button">Exportar álbum para compartilhar</button>
          </div>
        </div>

        <div class="share-card">
          <h3>📦 Exportar backup editável</h3>
          <p>Serve para guardar segurança ou continuar editando depois. É o melhor arquivo para o comprador não perder o trabalho.</p>
          <div class="editor-actions">
            <button id="btnExportarEditavelV6" type="button">Exportar backup editável</button>
          </div>
        </div>

        <div class="share-card">
          <h3>📲 Como enviar para o time</h3>
          <ol class="share-passos">
            <li>Monte o álbum e salve as alterações.</li>
            <li>Clique em <b>Exportar álbum para compartilhar</b>.</li>
            <li>Envie a pasta do álbum + o arquivo JSON pelo WhatsApp, Google Drive, pendrive ou e-mail.</li>
            <li>A pessoa abre o <b>index.html</b> da pasta.</li>
            <li>Depois importa o arquivo JSON se as alterações não aparecerem automaticamente.</li>
          </ol>
        </div>

        <div class="share-card">
          <h3>⚠️ Observação importante</h3>
          <p>Por ser offline e sem servidor, não existe link único automático. Para link público, precisa publicar a versão final em hospedagem, como GitHub Pages, Netlify ou outro servidor.</p>
        </div>

        <div class="share-status" id="shareStatusInfo">
          Produto configurado para uso offline em um aparelho, com opção de backup e compartilhamento por arquivo.
        </div>
      </div>
    `;
  }

  function adicionarAbaShare(){
    const modal = document.getElementById("editorClienteModal");
    const tabs = document.querySelector(".editor-tabs");
    if(!modal || !tabs) return false;
    if(document.getElementById("tab_compartilhar")) return true;

    const btn = document.createElement("button");
    btn.className = "editor-tab-btn";
    btn.type = "button";
    btn.dataset.tab = "compartilhar";
    btn.textContent = "Compartilhar";
    tabs.appendChild(btn);

    const div = document.createElement("div");
    div.className = "editor-tab";
    div.id = "tab_compartilhar";
    div.innerHTML = montarHTMLShare();

    const backup = document.getElementById("tab_backup");
    if(backup) backup.insertAdjacentElement("afterend", div);
    else modal.querySelector(".editor-card").appendChild(div);

    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".editor-tab").forEach(x=>x.classList.remove("ativo"));
      div.classList.add("ativo");
    });

    document.getElementById("btnExportarVisualizacao").onclick = exportarVisualizacao;
    document.getElementById("btnExportarEditavelV6").onclick = exportarEditavel;
    return true;
  }

  function iniciar(){
    let tentativas = 0;
    const timer = setInterval(()=>{
      tentativas++;
      if(adicionarAbaShare() || tentativas > 40){
        clearInterval(timer);
      }
    },250);
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
