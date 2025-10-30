document.addEventListener("DOMContentLoaded", () => {
    // Seletores dos Elementos da UI
    const selecaoNivelEl = document.getElementById("selecao-nivel");
    const gameContainerEl = document.getElementById("game-container");
    const resultadoContainerEl = document.getElementById("resultado-container");
    const botoesNivel = document.querySelectorAll(".btn-nivel");

    // Elementos do Jogo
    const contadorQuestoesEl = document.getElementById("contador-questoes");
    const placarAtualEl = document.getElementById("placar-atual");
    const modoTesteTituloEl = document.getElementById("modo-teste-titulo");
    const perguntaTextoEl = document.getElementById("pergunta-texto");
    const opcoesContainerEl = document.getElementById("opcoes-container");
    const feedbackContainerEl = document.getElementById("feedback-container");
    const voltarInicioBtn = document.getElementById("voltar-inicio-btn");

    // Elementos do Resultado
    const resultadoFinalTextoEl = document.getElementById("resultado-final-texto");
    const resultadoFeedbackEl = document.getElementById("resultado-feedback");
    const recomecarTesteBtn = document.getElementById("recomecar-teste-btn");
    const revisarErradasBtn = document.getElementById("revisar-erradas-btn");
    const voltarInicioResultadoBtn = document.getElementById("voltar-inicio-resultado-btn");

    // Variáveis de Estado
    let allQuestions = {};
    let currentQuestions = [];
    let currentIndex = 0;
    let score = 0;
    let currentLevel = '';
    let nomeNivelAtual = ''; // Armazena o título do nível (ex: "Conceitos de Nuvem")

    // Novas variáveis para o relatório de erros
    let questoesErradas = []; // Rastreia erros da rodada ATUAL
    let questoesParaRevisar = []; // Armazena erros da rodada ANTERIOR para o modo de revisão

    // Função principal: Carrega as questões do JSON
    async function init() {
        try {
            const response = await fetch('questoes.json');
            if (!response.ok) {
                throw new Error('Falha ao carregar o arquivo de questões.');
            }
            allQuestions = await response.json();
            
            botoesNivel.forEach(button => {
                button.addEventListener('click', () => {
                    currentLevel = button.getAttribute('data-level');
                    nomeNivelAtual = button.innerText; // Salva o nome do botão
                    startGame(currentLevel, nomeNivelAtual);
                });
            });

            // Listeners dos botões de resultado
            recomecarTesteBtn.addEventListener('click', () => {
                startGame(currentLevel, nomeNivelAtual); // Reinicia o mesmo teste
            });
            
            revisarErradasBtn.addEventListener('click', startReviewMode);
            voltarInicioResultadoBtn.addEventListener('click', goHome);
            voltarInicioBtn.addEventListener('click', goHome);

        } catch (error) {
            console.error("Erro ao iniciar o jogo:", error);
            selecaoNivelEl.innerHTML = "<h2>Erro ao carregar questões. Tente recarregar a página.</h2>";
        }
    }

    // Prepara e inicia o jogo
    function startGame(level, levelTitle) {
        // Reseta o estado para a rodada atual
        currentIndex = 0;
        score = 0;
        questoesErradas = []; // Limpa os erros da rodada atual
        
        // Define as questões
        if (level === 'revisao') {
            // Se for modo revisão, usa a lista de questões salvas
            currentQuestions = [...questoesParaRevisar];
        } else if (level === 'completo') {
            currentQuestions = Object.values(allQuestions).flat();
        } else {
            currentQuestions = allQuestions[level] ? [...allQuestions[level]] : [];
        }

        // Embaralha as questões (exceto se for revisão, para manter a ordem dos erros)
        if (level !== 'revisao') {
             currentQuestions = currentQuestions
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
        }

        // Atualiza a UI
        selecaoNivelEl.classList.add("hidden");
        resultadoContainerEl.classList.add("hidden");
        gameContainerEl.classList.remove("hidden");
        
        feedbackContainerEl.innerText = "";
        placarAtualEl.innerText = "Pontos: 0";
        modoTesteTituloEl.innerText = levelTitle; // Define o título do modo

        // Mostra a primeira questão
        showQuestion();
    }

    // Mostra a questão atual
    function showQuestion() {
        feedbackContainerEl.innerText = "";
        feedbackContainerEl.className = "";
        
        if (currentIndex < currentQuestions.length) {
            const q = currentQuestions[currentIndex];

            perguntaTextoEl.innerText = q.pergunta;
            contadorQuestoesEl.innerText = `Questão ${currentIndex + 1} de ${currentQuestions.length}`;
            opcoesContainerEl.innerHTML = "";

            const opcoesEmbaralhadas = [...q.opcoes]
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);

            opcoesEmbaralhadas.forEach(opcao => {
                const button = document.createElement("button");
                button.innerText = opcao;
                button.classList.add("btn-opcao");
                button.addEventListener('click', () => handleAnswerClick(button, q.respostaCorreta));
                opcoesContainerEl.appendChild(button);
            });
            
        } else {
            showResult();
        }
    }

    // Manipula o clique na resposta
    function handleAnswerClick(buttonClicked, respostaCorreta) {
        const respostaUsuario = buttonClicked.innerText;
        
        const botoesOpcao = document.querySelectorAll(".btn-opcao");
        botoesOpcao.forEach(btn => btn.disabled = true);

        if (respostaUsuario === respostaCorreta) {
            score++;
            buttonClicked.classList.add("correta");
            feedbackContainerEl.innerText = "Correto! ✔️";
            feedbackContainerEl.classList.add("correto");
        } else {
            buttonClicked.classList.add("incorreta");
            feedbackContainerEl.innerText = "Incorreto! ❌";
            feedbackContainerEl.classList.add("incorreto");
            
            // Adiciona a questão errada ao relatório
            questoesErradas.push(currentQuestions[currentIndex]);

            botoesOpcao.forEach(btn => {
                if (btn.innerText === respostaCorreta) {
                    btn.classList.add("correta");
                }
            });
        }
        
        placarAtualEl.innerText = `Pontos: ${score}`;

        setTimeout(() => {
            currentIndex++;
            showQuestion();
        }, 2000);
    }

    // Mostra a tela de resultado final
    function showResult() {
        gameContainerEl.classList.add("hidden");
        resultadoContainerEl.classList.remove("hidden");

        // Salva as questões erradas desta rodada para o "Modo Revisão"
        questoesParaRevisar = [...questoesErradas];

        // Mostra ou esconde o botão de revisar
        if (questoesParaRevisar.length > 0) {
            revisarErradasBtn.classList.remove("hidden");
            revisarErradasBtn.innerText = `Revisar ${questoesParaRevisar.length} Questões Erradas`;
        } else {
            revisarErradasBtn.classList.add("hidden");
        }

        const total = currentQuestions.length;
        const percentual = total > 0 ? Math.round((score / total) * 100) : 0;
        
        resultadoFinalTextoEl.innerText = `Você acertou ${score} de ${total} questões (${percentual}%)`;

        if (percentual === 100) {
            resultadoFeedbackEl.innerText = "Excelente! Você gabaritou! 🚀";
        } else if (percentual >= 70) {
            resultadoFeedbackEl.innerText = "Ótimo trabalho! Você está no caminho certo para a certificação!";
        } else if (percentual >= 50) {
            resultadoFeedbackEl.innerText = "Bom esforço! Continue revisando os tópicos.";
        } else {
            resultadoFeedbackEl.innerText = "Não desanime! Revise os pontos e tente novamente.";
        }
    }

    // Nova função para iniciar o modo de revisão
    function startReviewMode() {
        const reviewTitle = `Modo de Revisão (${questoesParaRevisar.length} Questões)`;
        currentLevel = 'revisao'; // Define um 'level' especial
        nomeNivelAtual = reviewTitle;
        startGame(currentLevel, nomeNivelAtual);
    }

    // Volta para a tela inicial
    function goHome() {
        resultadoContainerEl.classList.add("hidden");
        gameContainerEl.classList.add("hidden");
        selecaoNivelEl.classList.remove("hidden");
        
        // Reseta estados globais
        currentLevel = '';
        nomeNivelAtual = '';
        questoesErradas = [];
        questoesParaRevisar = [];
    }

    // Inicia o script
    init();
});