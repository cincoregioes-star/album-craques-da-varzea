
/* ===== QUIZ EDITÁVEL OFFLINE — V5 CORRIGIDO ===== */
(function(){
  const QUIZ_KEY = ((window.TEMA && TEMA.storageKey) || (window.ALBUM_TEMA && ALBUM_TEMA.storageKey) || "album") + "_QUIZ_CLIENTE_OFFLINE_V1";
  let quizCliente = null;
  let salvando = false;

  function e(texto){
    return String(texto ?? "").replace(/[&<>"']/g, s => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[s]));
  }

  function valorSeguro(el){
    if(!el) return "";
    if(typeof el.value === "undefined" || el.value === null) return "";
    return String(el.value).trim();
  }

  function quizBase(){
    const quiz = (window.TEMA && TEMA.quiz) || (window.ALBUM_TEMA && ALBUM_TEMA.quiz) || {};
    const perguntasOriginais = Array.isArray(quiz.perguntas) ? quiz.perguntas : [];
    const perguntas = [];

    for(let i=0;i<10;i++){
      const q = perguntasOriginais[i] || {};
      const op = Array.isArray(q.opcoes) ? q.opcoes : [];
      perguntas.push({
        pergunta: q.pergunta || "",
        opcoes: [op[0]||"", op[1]||"", op[2]||"", op[3]||""],
        correta: Number.isInteger(q.correta) ? q.correta : 0,
        comentario: q.comentario || ""
      });
    }

    return {
      titulo: quiz.titulo || "Quiz do Álbum",
      descricao: quiz.descricao || "Responda ao quiz para ganhar pacotes.",
      perguntas
    };
  }

  function normalizarQuiz(qz){
    const base = quizBase();
    const q = qz && typeof qz === "object" ? qz : base;

    q.titulo = q.titulo || base.titulo;
    q.descricao = q.descricao || base.descricao;
    if(!Array.isArray(q.perguntas)) q.perguntas = [];

    for(let i=0;i<10;i++){
      if(!q.perguntas[i]) q.perguntas[i] = base.perguntas[i];
      if(!Array.isArray(q.perguntas[i].opcoes)) q.perguntas[i].opcoes = ["","","",""];

      q.perguntas[i].pergunta = q.perguntas[i].pergunta || "";
      q.perguntas[i].comentario = q.perguntas[i].comentario || "";

      for(let j=0;j<4;j++){
        if(typeof q.perguntas[i].opcoes[j] === "undefined" || q.perguntas[i].opcoes[j] === null){
          q.perguntas[i].opcoes[j] = "";
        }
      }

      const correta = Number(q.perguntas[i].correta);
      q.perguntas[i].correta = Number.isNaN(correta) ? 0 : Math.max(0, Math.min(3, correta));
    }

    q.perguntas = q.perguntas.slice(0,10);
    return q;
  }

  function carregarQuiz(){
    try{
      const salvo = JSON.parse(localStorage.getItem(QUIZ_KEY));
      quizCliente = normalizarQuiz(salvo);
    }catch(err){
      quizCliente = quizBase();
    }
  }

  function salvarQuizStorage(){
    localStorage.setItem(QUIZ_KEY, JSON.stringify(quizCliente));
  }

  function aplicarQuiz(){
    if(!quizCliente) carregarQuiz();

    const copia = JSON.parse(JSON.stringify(quizCliente));

    if(window.TEMA) TEMA.quiz = copia;
    if(window.ALBUM_TEMA) ALBUM_TEMA.quiz = JSON.parse(JSON.stringify(quizCliente));
  }

  function confirmar(msg){
    let box = document.getElementById("quizConfirmacaoOffline");
    if(!box){
      box = document.createElement("div");
      box.id = "quizConfirmacaoOffline";
      box.style.cssText = [
        "position:fixed",
        "right:24px",
        "bottom:24px",
        "background:linear-gradient(135deg,#fff4b8,#f5c542,#c9971a)",
        "color:#111",
        "padding:14px 18px",
        "border-radius:16px",
        "font-weight:900",
        "z-index:999999",
        "box-shadow:0 12px 36px rgba(0,0,0,.45)"
      ].join(";");
      document.body.appendChild(box);
    }

    box.textContent = msg || "Quiz salvo neste aparelho.";
    box.style.display = "block";

    clearTimeout(window.__quizConfirmacaoTimer);
    window.__quizConfirmacaoTimer = setTimeout(()=>{ box.style.display = "none"; }, 2600);
  }

  function montarHTML(){
    if(!quizCliente) carregarQuiz();

    return `
      <div class="editor-aviso">
        Edite o quiz que libera pacotes. As alterações ficam salvas somente neste aparelho.
      </div>

      <div class="editor-form">
        <label class="full">Título do quiz
          <input id="quizTitulo" type="text" value="${e(quizCliente.titulo)}">
        </label>
        <label class="full">Descrição do quiz
          <input id="quizDescricao" type="text" value="${e(quizCliente.descricao)}">
        </label>
      </div>

      <div class="quiz-editor-list">
        ${quizCliente.perguntas.map((q,idx)=>`
          <div class="quiz-editor-item">
            <h3>Questão ${String(idx+1).padStart(2,"0")}</h3>
            <div class="quiz-editor-grid">
              <label class="quiz-full">Pergunta
                <textarea data-quiz="${idx}" data-campo="pergunta">${e(q.pergunta)}</textarea>
              </label>
              <label>Opção A
                <input data-quiz="${idx}" data-opcao="0" value="${e(q.opcoes[0])}">
              </label>
              <label>Opção B
                <input data-quiz="${idx}" data-opcao="1" value="${e(q.opcoes[1])}">
              </label>
              <label>Opção C
                <input data-quiz="${idx}" data-opcao="2" value="${e(q.opcoes[2])}">
              </label>
              <label>Opção D
                <input data-quiz="${idx}" data-opcao="3" value="${e(q.opcoes[3])}">
              </label>
              <label>Resposta correta
                <select data-quiz="${idx}" data-campo="correta">
                  <option value="0" ${q.correta===0?"selected":""}>A</option>
                  <option value="1" ${q.correta===1?"selected":""}>B</option>
                  <option value="2" ${q.correta===2?"selected":""}>C</option>
                  <option value="3" ${q.correta===3?"selected":""}>D</option>
                </select>
              </label>
              <label class="quiz-full">Comentário da resposta
                <textarea data-quiz="${idx}" data-campo="comentario">${e(q.comentario)}</textarea>
              </label>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="editor-actions">
        <button class="principal" id="salvarQuizOffline" type="button">Salvar quiz neste aparelho</button>
        <button id="restaurarQuizPadrao" type="button">Restaurar quiz original</button>
      </div>
    `;
  }

  function lerTela(){
    if(!quizCliente) carregarQuiz();

    quizCliente.titulo = valorSeguro(document.getElementById("quizTitulo")) || "Quiz do Álbum";
    quizCliente.descricao = valorSeguro(document.getElementById("quizDescricao")) || "Responda ao quiz para ganhar pacotes.";

    for(let i=0;i<10;i++){
      if(!quizCliente.perguntas[i]){
        quizCliente.perguntas[i] = {pergunta:"",opcoes:["","","",""],correta:0,comentario:""};
      }
      if(!Array.isArray(quizCliente.perguntas[i].opcoes)){
        quizCliente.perguntas[i].opcoes = ["","","",""];
      }
    }

    document.querySelectorAll("[data-quiz]").forEach(el=>{
      const idx = Number(el.dataset.quiz);
      if(Number.isNaN(idx) || idx < 0 || idx > 9) return;

      if(!quizCliente.perguntas[idx]){
        quizCliente.perguntas[idx] = {pergunta:"",opcoes:["","","",""],correta:0,comentario:""};
      }
      if(!Array.isArray(quizCliente.perguntas[idx].opcoes)){
        quizCliente.perguntas[idx].opcoes = ["","","",""];
      }

      if(typeof el.dataset.opcao !== "undefined"){
        const op = Number(el.dataset.opcao);
        if(op >= 0 && op <= 3) quizCliente.perguntas[idx].opcoes[op] = valorSeguro(el);
        return;
      }

      const campo = el.dataset.campo;
      if(campo === "correta"){
        const correta = Number(el.value);
        quizCliente.perguntas[idx].correta = Number.isNaN(correta) ? 0 : correta;
      }else if(campo === "pergunta" || campo === "comentario"){
        quizCliente.perguntas[idx][campo] = valorSeguro(el);
      }
    });

    quizCliente = normalizarQuiz(quizCliente);
  }

  function salvarQuiz(){
    if(salvando) return;
    salvando = true;

    try{
      lerTela();
      salvarQuizStorage();
      aplicarQuiz();

      try{ if(typeof renderQuiz === "function") renderQuiz(); }catch(e){}
      try{ if(typeof render === "function") render(); }catch(e){}

      confirmar("Quiz salvo neste aparelho.");
    }catch(err){
      alert("Erro ao salvar o quiz: " + (err && err.message ? err.message : err));
    }finally{
      setTimeout(()=>{ salvando = false; }, 400);
    }
  }

  function restaurarQuiz(){
    if(!confirm("Restaurar o quiz original e apagar o quiz personalizado deste aparelho?")) return;

    localStorage.removeItem(QUIZ_KEY);
    quizCliente = quizBase();
    aplicarQuiz();

    const tab = document.getElementById("tab_quiz");
    if(tab) tab.innerHTML = montarHTML();

    ligarEventos();
    try{ if(typeof renderQuiz === "function") renderQuiz(); }catch(e){}
    try{ if(typeof render === "function") render(); }catch(e){}

    confirmar("Quiz original restaurado.");
  }

  function adicionarAba(){
    const modal = document.getElementById("editorClienteModal");
    const tabs = document.querySelector(".editor-tabs");
    if(!modal || !tabs) return false;
    if(document.getElementById("tab_quiz")) return true;

    const btn = document.createElement("button");
    btn.className = "editor-tab-btn";
    btn.type = "button";
    btn.dataset.tab = "quiz";
    btn.textContent = "Quiz";
    tabs.appendChild(btn);

    const div = document.createElement("div");
    div.className = "editor-tab";
    div.id = "tab_quiz";
    div.innerHTML = montarHTML();

    const backup = document.getElementById("tab_backup");
    if(backup) backup.insertAdjacentElement("beforebegin", div);
    else modal.querySelector(".editor-card").appendChild(div);

    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".editor-tab").forEach(x=>x.classList.remove("ativo"));
      div.classList.add("ativo");
    });

    ligarEventos();
    return true;
  }

  function ligarEventos(){
    const salvar = document.getElementById("salvarQuizOffline");
    if(salvar) salvar.onclick = salvarQuiz;

    const restaurar = document.getElementById("restaurarQuizPadrao");
    if(restaurar) restaurar.onclick = restaurarQuiz;
  }

  function iniciar(){
    carregarQuiz();
    aplicarQuiz();

    let tentativas = 0;
    const timer = setInterval(()=>{
      tentativas++;
      if(adicionarAba() || tentativas > 40){
        clearInterval(timer);
      }
    }, 250);
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
