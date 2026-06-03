
/* ===== PAINEL MONTADOR OFFLINE — CÁPSULA DO TEMPO DIGITAL ===== */
(function(){
  const CUSTOM_KEY = (typeof STORAGE_KEY !== "undefined" ? STORAGE_KEY : "album") + "_CLIENTE_OFFLINE_V1";
  const DB_NAME = CUSTOM_KEY + "_DB";
  const DB_STORE = "midias";
  let db = null;
  let custom = { figs:{}, cores:{}, audio:{} };
  let mediaCache = {};
  let figSelecionada = 1;
  let imagemPendente = null;
  let audioPendente = null;

  function e(texto){
    return String(texto ?? "").replace(/[&<>"']/g, s => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[s]));
  }
  function p2(n){return String(n).padStart(2,"0")}
  function mediaKeyFig(n){return "fig-" + p2(n)}
  function defaultCustom(){
    return { figs:{}, cores:{}, audio:{} };
  }
  function carregarCustom(){
    try{
      const v = JSON.parse(localStorage.getItem(CUSTOM_KEY));
      if(v && typeof v === "object") custom = { ...defaultCustom(), ...v, figs:v.figs||{}, cores:v.cores||{}, audio:v.audio||{} };
    }catch(err){ custom = defaultCustom(); }
  }
  function salvarCustom(){
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
  }
  function abrirDB(){
    return new Promise((resolve,reject)=>{
      const req = indexedDB.open(DB_NAME,1);
      req.onupgradeneeded = () => {
        const database = req.result;
        if(!database.objectStoreNames.contains(DB_STORE)) database.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }
  function dbSet(key,value){
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readwrite");
      tx.objectStore(DB_STORE).put(value,key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
  function dbGet(key){
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readonly");
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  function dbDelete(key){
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readwrite");
      tx.objectStore(DB_STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
  function dbKeys(){
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readonly");
      const req = tx.objectStore(DB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
  function dbClear(){
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readwrite");
      tx.objectStore(DB_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
  function fileToDataURL(file){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function aplicarCores(){
    const c = custom.cores || {};
    const root = document.documentElement;
    if(c.bg) root.style.setProperty("--bg", c.bg);
    if(c.bg2) root.style.setProperty("--bg2", c.bg2);
    if(c.panel) root.style.setProperty("--panel", c.panel);
    if(c.panel2) root.style.setProperty("--panel2", c.panel2);
    if(c.gold) root.style.setProperty("--gold", c.gold);
    if(c.gold2) root.style.setProperty("--gold2", c.gold2);
    if(c.text) root.style.setProperty("--ink", c.text);
  }

  function aplicarTextos(){
    if(typeof FIGURINHAS === "undefined") return;
    FIGURINHAS.forEach(fig=>{
      const cf = custom.figs?.[fig.numero];
      if(!cf) return;
      if(cf.titulo) fig.titulo = cf.titulo;
      if(cf.descricao) fig.descricao = cf.descricao;
      fig.ficha = { ...(fig.ficha||{}), ...(cf.ficha||{}) };
    });
  }

  async function carregarMidias(){
    if(!db) return;
    mediaCache = {};
    const keys = await dbKeys();
    for(const key of keys){
      mediaCache[key] = await dbGet(key);
    }
  }

  function aplicarAudioCliente(){
    if(!custom.audio || !custom.audio.fundo) return;
    const data = mediaCache["audio-fundo"];
    if(data && typeof audio !== "undefined" && audio.fundo){
      const estavaAtivo = typeof audioAtivo !== "undefined" && audioAtivo;
      try{
        audio.fundo.pause();
        audio.fundo.src = data;
        audio.fundo.loop = true;
        audio.fundo.volume = 0.22;
        if(estavaAtivo) audio.fundo.play().catch(()=>{});
      }catch(e){}
    }
  }

  function instalarOverrideImagem(){
    if(typeof window.__editorImagemOverrideInstalado !== "undefined") return;
    window.__editorImagemOverrideInstalado = true;

    if(typeof imagemHTML === "function"){
      window.__imagemHTMLOriginal = imagemHTML;
      imagemHTML = function(fig){
        const key = mediaKeyFig(fig.numero);
        const personalizada = mediaCache[key];
        if(personalizada){
          return `<img src="${personalizada}" data-num="${p2(fig.numero)}" alt="${e(fig.titulo)}">`;
        }
        return window.__imagemHTMLOriginal(fig);
      };
    }
  }

  function atualizarTela(){
    aplicarCores();
    aplicarTextos();
    aplicarAudioCliente();
    if(typeof render === "function") render();
  }

  function figAtual(){
    return FIGURINHAS.find(f=>Number(f.numero)===Number(figSelecionada)) || FIGURINHAS[0];
  }

  function opcoesFigurinhas(){
    return FIGURINHAS.map(f=>`<option value="${f.numero}">${p2(f.numero)} — ${e(f.titulo)}</option>`).join("");
  }

  function valorCampo(chave){
    const fig = figAtual();
    const cf = custom.figs?.[fig.numero] || {};
    if(chave === "titulo") return cf.titulo ?? fig.titulo ?? "";
    if(chave === "descricao") return cf.descricao ?? fig.descricao ?? "";
    return cf.ficha?.[chave] ?? fig.ficha?.[chave] ?? "";
  }

  function imagemPreview(){
    const key = mediaKeyFig(figSelecionada);
    const fig = figAtual();
    const src = mediaCache[key] || `figurinhas/figurinha-${p2(fig.numero)}.webp`;
    return `<img id="editorPreviewImg" src="${src}" onerror="this.style.display='none'"><small>Figurinha ${p2(fig.numero)} — ${e(fig.titulo)}</small>`;
  }

  function preencherEditor(){
    const fig = figAtual();
    document.getElementById("editorSelectFig").value = String(fig.numero);
    document.getElementById("editorPreview").innerHTML = imagemPreview();
    const ids = ["titulo","descricao","nome","posicao","camisa","time","ano","local","historia","curiosidade","conquista","mensagem"];
    ids.forEach(id=>{
      const el = document.getElementById("ed_"+id);
      if(el) el.value = valorCampo(id);
    });
  }

  function abrirEditor(){
    document.getElementById("editorClienteModal").classList.add("ativo");
    document.getElementById("editorSelectFig").innerHTML = opcoesFigurinhas();
    preencherEditor();
  }
  function fecharEditor(){
    document.getElementById("editorClienteModal").classList.remove("ativo");
  }

  async function salvarFigurinha(){
    const n = Number(document.getElementById("editorSelectFig").value);
    const dados = {
      titulo: document.getElementById("ed_titulo").value.trim(),
      descricao: document.getElementById("ed_descricao").value.trim(),
      ficha: {
        nome: document.getElementById("ed_nome").value.trim(),
        posicao: document.getElementById("ed_posicao").value.trim(),
        camisa: document.getElementById("ed_camisa").value.trim(),
        time: document.getElementById("ed_time").value.trim(),
        ano: document.getElementById("ed_ano").value.trim(),
        local: document.getElementById("ed_local").value.trim(),
        historia: document.getElementById("ed_historia").value.trim(),
        curiosidade: document.getElementById("ed_curiosidade").value.trim(),
        conquista: document.getElementById("ed_conquista").value.trim(),
        mensagem: document.getElementById("ed_mensagem").value.trim()
      }
    };
    custom.figs[n] = dados;

    if(imagemPendente){
      const data = await fileToDataURL(imagemPendente);
      await dbSet(mediaKeyFig(n), data);
      mediaCache[mediaKeyFig(n)] = data;
      imagemPendente = null;
      document.getElementById("editorFoto").value = "";
    }

    salvarCustom();
    atualizarTela();
    preencherEditor();
    alert("Figurinha salva neste aparelho.");
  }

  async function salvarCores(){
    custom.cores = {
      bg: document.getElementById("cor_bg").value,
      bg2: document.getElementById("cor_bg2").value,
      panel: document.getElementById("cor_panel").value,
      panel2: document.getElementById("cor_panel2").value,
      gold: document.getElementById("cor_gold").value,
      gold2: document.getElementById("cor_gold2").value,
      text: document.getElementById("cor_text").value
    };
    salvarCustom();
    aplicarCores();
    alert("Cores salvas neste aparelho.");
  }

  async function salvarAudioFundo(){
    if(!audioPendente){
      alert("Escolha um áudio primeiro.");
      return;
    }
    const data = await fileToDataURL(audioPendente);
    await dbSet("audio-fundo", data);
    mediaCache["audio-fundo"] = data;
    custom.audio.fundo = true;
    salvarCustom();
    audioPendente = null;
    document.getElementById("editorAudioFundo").value = "";
    aplicarAudioCliente();
    alert("Música de fundo salva neste aparelho.");
  }

  async function exportarBackup(){
    const keys = await dbKeys();
    const midias = {};
    for(const key of keys){
      midias[key] = await dbGet(key);
    }
    const backup = {
      tipo: "backup-album-offline",
      produto: TEMA.nome || "Álbum Digital",
      data: new Date().toISOString(),
      custom,
      midias
    };
    const blob = new Blob([JSON.stringify(backup,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-album-offline.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importarBackup(file){
    if(!file) return;
    const texto = await file.text();
    const backup = JSON.parse(texto);
    if(!backup || backup.tipo !== "backup-album-offline"){
      alert("Arquivo de backup inválido.");
      return;
    }
    custom = { ...defaultCustom(), ...(backup.custom||{}) };
    salvarCustom();
    await dbClear();
    const midias = backup.midias || {};
    for(const [key,value] of Object.entries(midias)){
      await dbSet(key,value);
    }
    await carregarMidias();
    atualizarTela();
    preencherEditor();
    alert("Backup importado com sucesso.");
  }

  async function limparPersonalizacao(){
    if(!confirm("Tem certeza? Isso remove fotos, textos, cores e música personalizados deste aparelho.")) return;
    localStorage.removeItem(CUSTOM_KEY);
    custom = defaultCustom();
    await dbClear();
    mediaCache = {};
    location.reload();
  }

  function trocarTab(nome){
    document.querySelectorAll(".editor-tab").forEach(x=>x.classList.remove("ativo"));
    document.querySelectorAll(".editor-tab-btn").forEach(x=>x.classList.remove("ativo"));
    document.getElementById("tab_"+nome).classList.add("ativo");
  }

  function inserirHTML(){
    const nav = document.querySelector(".nav");
    if(nav && !document.getElementById("btnEditorCliente")){
      const btn = document.createElement("button");
      btn.id = "btnEditorCliente";
      btn.className = "btn-editor-cliente";
      btn.type = "button";
      btn.textContent = "⚙️ Montar Álbum";
      nav.insertBefore(btn, nav.firstChild);
      btn.addEventListener("click", abrirEditor);
    }

    document.body.insertAdjacentHTML("beforeend", `
      <section class="editor-modal" id="editorClienteModal">
        <div class="editor-card">
          <div class="editor-top">
            <div>
              <h2>Montar Álbum Offline</h2>
              <div class="editor-aviso">Escolha foto da galeria, edite os dados e salve. Tudo fica guardado somente neste aparelho.</div>
            </div>
            <button class="editor-fechar" id="editorFechar" type="button">×</button>
          </div>

          <div class="editor-tabs">
            <button class="editor-tab-btn" type="button" data-tab="fig">Figurinhas</button>
            <button class="editor-tab-btn" type="button" data-tab="cores">Cores</button>
            <button class="editor-tab-btn" type="button" data-tab="audio">Áudio</button>
            <button class="editor-tab-btn" type="button" data-tab="backup">Backup</button>
          </div>

          <div class="editor-tab ativo" id="tab_fig">
            <div class="editor-grid">
              <div class="editor-preview" id="editorPreview"></div>
              <div>
                <div class="editor-form">
                  <label class="full">Selecionar figurinha
                    <select id="editorSelectFig"></select>
                  </label>
                  <label class="full">Escolher foto da galeria
                    <input type="file" id="editorFoto" accept="image/*">
                  </label>
                  <label>Título
                    <input id="ed_titulo" type="text">
                  </label>
                  <label>Subtítulo / descrição
                    <input id="ed_descricao" type="text">
                  </label>
                  <label>Nome
                    <input id="ed_nome" type="text">
                  </label>
                  <label>Posição
                    <input id="ed_posicao" type="text">
                  </label>
                  <label>Camisa
                    <input id="ed_camisa" type="text">
                  </label>
                  <label>Time
                    <input id="ed_time" type="text">
                  </label>
                  <label>Ano
                    <input id="ed_ano" type="text">
                  </label>
                  <label>Local
                    <input id="ed_local" type="text">
                  </label>
                  <label class="full">História
                    <textarea id="ed_historia"></textarea>
                  </label>
                  <label class="full">Curiosidade
                    <textarea id="ed_curiosidade"></textarea>
                  </label>
                  <label class="full">Conquista
                    <textarea id="ed_conquista"></textarea>
                  </label>
                  <label class="full">Mensagem
                    <textarea id="ed_mensagem"></textarea>
                  </label>
                </div>
                <div class="editor-actions">
                  <button class="principal" id="editorSalvarFig" type="button">Salvar figurinha neste aparelho</button>
                </div>
              </div>
            </div>
          </div>

          <div class="editor-tab" id="tab_cores">
            <div class="editor-aviso">Altere as cores do álbum. Essa personalização também fica salva neste aparelho.</div>
            <div class="editor-cores">
              <label>Fundo 1 <input id="cor_bg" type="color" value="#050505"></label>
              <label>Fundo 2 <input id="cor_bg2" type="color" value="#111111"></label>
              <label>Painel 1 <input id="cor_panel" type="color" value="#0b0b0b"></label>
              <label>Painel 2 <input id="cor_panel2" type="color" value="#1a1a1a"></label>
              <label>Dourado 1 <input id="cor_gold" type="color" value="#f5c542"></label>
              <label>Dourado 2 <input id="cor_gold2" type="color" value="#c9971a"></label>
              <label>Texto <input id="cor_text" type="color" value="#fffaf0"></label>
            </div>
            <div class="editor-actions">
              <button class="principal" id="editorSalvarCores" type="button">Salvar cores</button>
            </div>
          </div>

          <div class="editor-tab" id="tab_audio">
            <div class="editor-aviso">O cliente pode trocar a música de fundo por uma música do próprio aparelho.</div>
            <div class="editor-form">
              <label class="full">Escolher nova música de fundo
                <input type="file" id="editorAudioFundo" accept="audio/*">
              </label>
            </div>
            <div class="editor-actions">
              <button class="principal" id="editorSalvarAudio" type="button">Salvar música de fundo</button>
            </div>
          </div>

          <div class="editor-tab" id="tab_backup">
            <div class="editor-aviso">Use backup para guardar ou transferir a personalização. Sem backup, se limpar o navegador pode perder.</div>
            <div class="editor-actions">
              <button class="principal" id="editorExportar" type="button">Exportar backup</button>
              <label class="editor-tab-btn">Importar backup
                <input class="editor-hidden" type="file" id="editorImportar" accept="application/json,.json">
              </label>
              <button id="editorLimpar" type="button">Limpar personalização</button>
            </div>
          </div>
        </div>
      </section>
    `);
  }

  function ligarEventos(){
    document.getElementById("editorFechar").addEventListener("click", fecharEditor);
    document.getElementById("editorSelectFig").addEventListener("change", ev=>{
      figSelecionada = Number(ev.target.value);
      imagemPendente = null;
      preencherEditor();
    });
    document.getElementById("editorFoto").addEventListener("change", ev=>{
      imagemPendente = ev.target.files?.[0] || null;
      if(imagemPendente){
        const url = URL.createObjectURL(imagemPendente);
        document.getElementById("editorPreview").innerHTML = `<img src="${url}"><small>Nova foto selecionada. Clique em salvar.</small>`;
      }
    });
    document.getElementById("editorSalvarFig").addEventListener("click", salvarFigurinha);
    document.getElementById("editorSalvarCores").addEventListener("click", salvarCores);
    document.getElementById("editorAudioFundo").addEventListener("change", ev=>{ audioPendente = ev.target.files?.[0] || null; });
    document.getElementById("editorSalvarAudio").addEventListener("click", salvarAudioFundo);
    document.getElementById("editorExportar").addEventListener("click", exportarBackup);
    document.getElementById("editorImportar").addEventListener("change", ev=>importarBackup(ev.target.files?.[0]));
    document.getElementById("editorLimpar").addEventListener("click", limparPersonalizacao);
    document.querySelectorAll(".editor-tab-btn[data-tab]").forEach(btn=>{
      btn.addEventListener("click", ()=>trocarTab(btn.dataset.tab));
    });
  }

  async function init(){
    carregarCustom();
    await abrirDB();
    await carregarMidias();
    aplicarCores();
    aplicarTextos();
    instalarOverrideImagem();
    inserirHTML();
    ligarEventos();

    const c = custom.cores || {};
    const set = (id,val) => { const el=document.getElementById(id); if(el && val) el.value = val; };
    set("cor_bg", c.bg);
    set("cor_bg2", c.bg2);
    set("cor_panel", c.panel);
    set("cor_panel2", c.panel2);
    set("cor_gold", c.gold);
    set("cor_gold2", c.gold2);
    set("cor_text", c.text);

    aplicarAudioCliente();
    if(typeof render === "function") render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(()=>init().catch(err=>alert("Erro ao iniciar editor offline: " + err.message)), 200);
  });
})();
