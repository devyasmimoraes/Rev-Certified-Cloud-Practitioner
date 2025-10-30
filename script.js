document.addEventListener("DOMContentLoaded", () => {
    // Seletores dos Elementos da UI
    const selecaoNivelEl = document.getElementById("selecao-nivel");
    const gameContainerEl = document.getElementById("game-container");
    const resultadoContainerEl = document.getElementById("resultado-container");
    const botoesNivel = document.querySelectorAll(".btn-nivel");

    // Elementos do Jogo
    const contadorQuestoesEl = document.getElementById("contador-questoes");
    const placarAtualEl = document.getElementById("placar-atual");
    const perguntaTextoEl = document.getElementById("pergunta-texto");
    const opcoesContainerEl = document.getElementById("opcoes-container");
    const feedbackContainerEl = document.getElementById("feedback-container");
    const voltarInicioBtn = document.getElementById("voltar-inicio-btn");

    // Elementos do Resultado
    const resultadoFinalTextoEl = document.getElementById("resultado-final-texto");
    const resultadoFeedbackEl = document.getElementById("resultado-feedback");
    const recomecarBtn = document.getElementById("recomecar-btn");

    // Variáveis de Estado
    let allQuestions = {};
    let currentQuestions = [];
    let currentIndex = 0;
    let score = 0;
    let currentLevel = '';

    // Função principal: Carrega as questões do JSON
    async function init() {
        try {
            // Usa o novo arquivo 'questoes.json'
            const response = await fetch('questoes.json');
            if (!response.ok) {
                throw new Error('Falha ao carregar o arquivo de questões.');
            }
            allQuestions = await response.json();
            
            // Adiciona listeners aos botões de nível
            botoesNivel.forEach(button => {
                button.addEventListener('click', () => {
                    currentLevel = button.getAttribute('data-level');
                    startGame(currentLevel);
                });
            });

            // Listener para o botão de recomeçar
            recomecarBtn.addEventListener('click', () => {
                resultadoContainerEl.classList.add('hidden');
                // Se o último jogo foi 'completo', recomeça ele, senão, volta ao início
                if (currentLevel) {
                    startGame(currentLevel);
                } else {
                    goHome();
                }
            });

            voltarInicioBtn.addEventListener('click', goHome);

        } catch (error) {
            console.error("Erro ao iniciar o jogo:", error);
            selecaoNivelEl.innerHTML = "<h2>Erro ao carregar questões. Tente recarregar a página.</h2>";
        }
    }

    // Prepara e inicia o jogo
    function startGame(level) {
        // Reseta o estado
        currentIndex = 0;
        score = 0;
        currentQuestions = [];

        // Prepara as questões
        if (level === 'completo') {
            // Junta todas as questões de todos os níveis
            currentQuestions = Object.values(allQuestions).flat();
        } else {
            // Pega apenas as questões do nível selecionado
            currentQuestions = allQuestions[level] ? [...allQuestions[level]] : [];
        }

        // Embaralha as questões
        currentQuestions = currentQuestions
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        // Atualiza a UI
        selecaoNivelEl.classList.add("hidden");
        resultadoContainerEl.classList.add("hidden");
        gameContainerEl.classList.remove("hidden");
        feedbackContainerEl.innerText = "";
        placarAtualEl.innerText = "Pontos: 0";

        // Mostra a primeira questão
        showQuestion();
    }

    // Mostra a questão atual
    function showQuestion() {
        // Limpa o feedback anterior
        feedbackContainerEl.innerText = "";
        feedbackContainerEl.className = "";
        
        if (currentIndex < currentQuestions.length) {
            const q = currentQuestions[currentIndex];

            // Atualiza textos
            perguntaTextoEl.innerText = q.pergunta;
            contadorQuestoesEl.innerText = `Questão ${currentIndex + 1} de ${currentQuestions.length}`;
            
            // Limpa opções anteriores
            opcoesContainerEl.innerHTML = "";

            // Embaralha as opções da pergunta atual
            const opcoesEmbaralhadas = [...q.opcoes]
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);

            // Cria os botões de opção
            opcoesEmbaralhadas.forEach(opcao => {
                const button = document.createElement("button");
                button.innerText = opcao;
                button.classList.add("btn-opcao");
                button.addEventListener('click', () => handleAnswerClick(button, q.respostaCorreta));
                opcoesContainerEl.appendChild(button);
            });
            
        } else {
            // Fim do Quiz
            showResult();
        }
    }

    // Manipula o clique na resposta
    function handleAnswerClick(buttonClicked, respostaCorreta) {
        const respostaUsuario = buttonClicked.innerText;
        
        // Desabilita todos os botões após o clique
        const botoesOpcao = document.querySelectorAll(".btn-opcao");
        botoesOpcao.forEach(btn => btn.disabled = true);

        if (respostaUsuario === respostaCorreta) {
            // Resposta Correta
            score++;
            buttonClicked.classList.add("correta");
            feedbackContainerEl.innerText = "Correto! ✔️";
            feedbackContainerEl.classList.add("correto");
        } else {
            // Resposta Incorreta
            buttonClicked.classList.add("incorreta");
            feedbackContainerEl.innerText = "Incorreto! ❌";
            feedbackContainerEl.classList.add("incorreto");
            
            // Mostra qual era a correta
            botoesOpcao.forEach(btn => {
                if (btn.innerText === respostaCorreta) {
                    btn.classList.add("correta");
                }
            });
        }
        
        // Atualiza o placar
        placarAtualEl.innerText = `Pontos: ${score}`;

        // Vai para a próxima pergunta após 2 segundos
        setTimeout(() => {
            currentIndex++;
            showQuestion();
        }, 2000);
    }

    // Mostra a tela de resultado final
    function showResult() {
        gameContainerEl.classList.add("hidden");
        resultadoContainerEl.classList.remove("hidden");

        const total = currentQuestions.length;
        const percentual = total > 0 ? Math.round((score / total) * 100) : 0;
        
        resultadoFinalTextoEl.innerText = `Você acertou ${score} de ${total} questões (${percentual}%)`;

        // Feedback com base na pontuação
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

    // Volta para a tela inicial
    function goHome() {
        resultadoContainerEl.classList.add("hidden");
        gameContainerEl.classList.add("hidden");
        selecaoNivelEl.classList.remove("hidden");
        currentLevel = ''; // Reseta o nível atual
    }

    // Inicia o script
    init();
});