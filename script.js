// --- Elementos do Jogo ---
const levelSelectMenu = document.getElementById('level-select');
const questionContainer = document.getElementById('question-container');
const questTitle = document.getElementById('quest-title');
const questionText = document.getElementById('question-text');
const answerButtonsElement = document.getElementById('answer-buttons');
const feedbackElement = document.getElementById('feedback');
const nextButton = document.getElementById('next-btn');
const backButton = document.getElementById('back-btn');

// --- NOVOS Elementos ---
const scoreElement = document.getElementById('score');
const explanationElement = document.getElementById('explanation');

// --- NOVAS Variáveis de Jogo ---
let shuffledQuestions, currentQuestionIndex, currentLevelName;
let score = 0;

// --- Event Listeners (Controles) ---
levelSelectMenu.addEventListener('click', (e) => {
    if (e.target.classList.contains('level-btn')) {
        const level = e.target.dataset.level;
        startGame(level);
    }
});

nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    setNextQuestion();
});

backButton.addEventListener('click', showMenu);

// --- Banco de Perguntas (ATUALIZADO com Explicações e mais Nível 4) ---
const allQuestions = {
    1: { // Nível 1: Conceitos
        name: "Nível 1: Conceitos de Nuvem",
        questions: [
            {
                question: 'O que é IaaS (Infraestrutura como Serviço)?',
                answers: [
                    { text: 'Você gerencia tudo (ex: EC2)', correct: true },
                    { text: 'Só gerencia o app (ex: Elastic Beanstalk)', correct: false },
                    { text: 'Tudo pronto, só usa (ex: Chime)', correct: false },
                    { text: 'Um data center local', correct: false }
                ],
                explanation: 'IaaS (ex: EC2) significa que você gerencia o S.O. e os apps, enquanto a AWS cuida do hardware. Em PaaS (ex: Elastic Beanstalk), a AWS cuida do S.O. e você só gerencia o app.'
            },
            {
                question: 'O que é PaaS (Plataforma como Serviço)?',
                answers: [
                    { text: 'Você gerencia o S.O. e o hardware', correct: false },
                    { text: 'Só gerencia o app, AWS cuida da infra (ex: Elastic Beanstalk)', correct: true },
                    { text: 'Um software de planilha', correct: false },
                    { text: 'Um servidor físico', correct: false }
                ],
                explanation: 'PaaS (ex: Elastic Beanstalk) é quando você só gerencia a aplicação, e a AWS cuida de toda a infraestrutura e S.O. IaaS (ex: EC2) exige que você gerencie o S.O.'
            },
            {
                question: 'Qual componente da Infraestrutura Global garante Alta Disponibilidade?',
                answers: [
                    { text: 'Região (Region)', correct: false },
                    { text: 'Local de Borda (Edge Location)', correct: false },
                    { text: 'Zona de Disponibilidade (AZ)', correct: true },
                    { text: 'AWS Organizations', correct: false }
                ],
                explanation: 'As Zonas de Disponibilidade (AZs) são data centers independentes dentro de uma Região. Usar múltiplas AZs garante Alta Disponibilidade (Tolerância a Falhas).'
            },
            {
                question: 'Para que servem os "Edge Locations"?',
                answers: [
                    { text: 'Para hospedar instâncias EC2', correct: false },
                    { text: 'Para acelerar entrega de conteúdo (CloudFront)', correct: true },
                    { text: 'Para backups de banco de dados', correct: false },
                    { text: 'Para isolar redes VPC', correct: false }
                ],
                explanation: 'Edge Locations (Locais de Borda) são pontos de presença usados pelo Amazon CloudFront (CDN) para entregar conteúdo (vídeos, sites) rapidamente aos usuários, com baixa latência.'
            }
        ]
    },
    2: { // Nível 2: Segurança
        name: "Nível 2: Segurança",
        questions: [
            {
                question: 'No Modelo de Responsabilidade Compartilhada, quem é responsável pela "segurança NA nuvem" (dados, usuários, permissões)?',
                answers: [
                    { text: 'A AWS', correct: false },
                    { text: 'O Cliente', correct: true },
                    { text: 'Ambos', correct: false },
                    { text: 'Ninguém', correct: false }
                ],
                explanation: 'O Cliente é sempre responsável pela segurança "NA" nuvem. Isso inclui gerenciar seus dados, permissões de usuários (IAM), criptografia e configurações de rede.'
            },
            {
                question: 'No Modelo de Responsabilidade Compartilhada, quem é responsável pela "segurança DA nuvem" (hardware, data centers)?',
                answers: [
                    { text: 'A AWS', correct: true },
                    { text: 'O Cliente', correct: false },
                    { text: 'O Gerente de Contas (TAM)', correct: false },
                    { text: 'O S3', correct: false }
                ],
                explanation: 'A AWS é responsável pela segurança "DA" nuvem. Isso inclui o hardware, a rede física, e os data centers (Regiões, AZs).'
            },
            {
                question: 'Qual serviço é usado para criar usuários, grupos, papéis (roles) e políticas de permissão?',
                answers: [
                    { text: 'AWS Organizations', correct: false },
                    { text: 'Amazon EC2', correct: false },
                    { text: 'AWS IAM', correct: true },
                    { text: 'AWS Budgets', correct: false }
                ],
                explanation: 'O AWS IAM (Identity and Access Management) é o serviço central para gerenciar quem (usuários, grupos) pode fazer o quê (políticas, roles) na sua conta.'
            },
            {
                question: 'Qual serviço monitora MÉTRICAS (como uso de CPU) e qual serviço monitora LOGS DE API (como "quem criou uma instância")?',
                answers: [
                    { text: 'CloudWatch (métricas) e CloudTrail (logs)', correct: true },
                    { text: 'CloudTrail (métricas) e CloudWatch (logs)', correct: false },
                    { text: 'Ambos fazem o mesmo', correct: false },
                    { text: 'Trusted Advisor (ambos)', correct: false }
                ],
                explanation: 'CloudWatch monitora métricas de desempenho (CPU, Rede). CloudTrail monitora logs de auditoria (Quem fez o quê? Qual API foi chamada?).'
            },
            {
                question: 'Quais são os 5 pilares do AWS Well-Architected Framework?',
                answers: [
                    { text: 'Segurança, Custo, Rede, Regiões e AZs', correct: false },
                    { text: 'Excelência operacional, Segurança, Confiabilidade, Eficiência de desempenho, Otimização de custos', correct: true },
                    { text: 'EC2, S3, RDS, VPC, Lambda', correct: false },
                    { text: 'Basic, Developer, Business, Enterprise, TAM', correct: false }
                ],
                explanation: 'Os 5 pilares são: Excelência Operacional, Segurança, Confiabilidade, Eficiência de Desempenho e Otimização de Custos.'
            }
        ]
    },
    3: { // Nível 3: Tecnologia
        name: "Nível 3: Tecnologia",
        questions: [
            {
                question: 'Qual serviço é descrito como "servidores virtuais"?',
                answers: [
                    { text: 'Amazon S3', correct: false },
                    { text: 'AWS Lambda', correct: false },
                    { text: 'Amazon EC2', correct: true },
                    { text: 'Amazon DynamoDB', correct: false }
                ],
                explanation: 'O Amazon EC2 (Elastic Compute Cloud) é o serviço principal de servidores virtuais (instâncias) na nuvem.'
            },
            {
                question: 'Qual serviço permite executar código SEM servidor (Serverless)?',
                answers: [
                    { text: 'Amazon EC2', correct: false },
                    { text: 'AWS Lambda', correct: true },
                    { text: 'Amazon RDS', correct: false },
                    { text: 'Amazon EFS', correct: false }
                ],
                explanation: 'O AWS Lambda é o serviço de computação "serverless" (sem servidor). Você paga apenas pelo tempo de execução do seu código, sem gerenciar instâncias.'
            },
            {
                question: 'Qual serviço é usado para "armazenamento de objetos" (arquivos, backups) com alta durabilidade?',
                answers: [
                    { text: 'Amazon S3', correct: true },
                    { text: 'Amazon EBS', correct: false },
                    { text: 'Amazon EFS', correct: false },
                    { text: 'Amazon RDS', correct: false }
                ],
                explanation: 'O Amazon S3 é o serviço de armazenamento de objetos. EBS é um "HD" para EC2 (bloco) e EFS é um sistema de arquivos compartilhado.'
            },
            {
                question: 'Qual serviço de banco de dados é NoSQL, rápido e totalmente gerenciado?',
                answers: [
                    { text: 'Amazon RDS', correct: false },
                    { text: 'Amazon S3', correct: false },
                    { text: 'Amazon DynamoDB', correct: true },
                    { text: 'Amazon EC2', correct: false }
                ],
                explanation: 'O Amazon DynamoDB é o banco de dados NoSQL (chave-valor) da AWS. O RDS é para bancos de dados relacionais (SQL).'
            },
            {
                question: 'Qual serviço é a CDN (Rede de Distribuição de Conteúdo) da AWS?',
                answers: [
                    { text: 'Amazon VPC', correct: false },
                    { text: 'Amazon Route 53', correct: false },
                    { text: 'Amazon S3', correct: false },
                    { text: 'Amazon CloudFront', correct: true }
                ],
                explanation: 'O Amazon CloudFront é a CDN da AWS, que usa os Edge Locations para entregar conteúdo globalmente com baixa latência.'
            }
        ]
    },
    4: { // Nível 4: Faturamento (MAIS PERGUNTAS)
        name: "Nível 4: Faturamento",
        questions: [
            {
                question: 'Qual ferramenta de custo é usada para ANALISAR gastos e tendências?',
                answers: [
                    { text: 'AWS Budgets', correct: false },
                    { text: 'AWS Cost Explorer', correct: true },
                    { text: 'Tags de Custo', correct: false },
                    { text: 'Plano Basic', correct: false }
                ],
                explanation: 'O AWS Cost Explorer é usado para analisar e visualizar seus gastos passados e prever tendências. O AWS Budgets é usado para criar alertas.'
            },
            {
                question: 'Qual ferramenta de custo é usada para criar ALERTAS de limite de gasto?',
                answers: [
                    { text: 'AWS Budgets', correct: true },
                    { text: 'AWS Cost Explorer', correct: false },
                    { text: 'Trusted Advisor', correct: false },
                    { text: 'AWS Organizations', correct: false }
                ],
                explanation: 'O AWS Budgets permite que você crie alertas que notificam quando seus gastos ou uso excedem um limite definido.'
            },
            {
                question: 'Qual tipo de instância EC2 oferece até 90% de desconto, mas pode ser interrompida a qualquer momento?',
                answers: [
                    { text: 'On-Demand', correct: false },
                    { text: 'Reserved Instances', correct: false },
                    { text: 'Spot Instances', correct: true },
                    { text: 'Savings Plans', correct: false }
                ],
                explanation: 'As Spot Instances usam capacidade ociosa da AWS com grande desconto, mas a AWS pode interrompê-las se precisar da capacidade de volta.'
            },
            {
                question: 'Qual plano de suporte da AWS oferece um Gerente Técnico dedicado (TAM)?',
                answers: [
                    { text: 'Basic', correct: false },
                    { text: 'Developer', correct: false },
                    { text: 'Business', correct: false },
                    { text: 'Enterprise', correct: true }
                ],
                explanation: 'O plano Enterprise é o único que oferece um Gerente Técnico de Contas (TAM) dedicado.'
            },
            { // NOVA PERGUNTA
                question: 'Qual plano de suporte oferece suporte técnico básico via e-mail, ideal para testes?',
                answers: [
                    { text: 'Basic', correct: false },
                    { text: 'Developer', correct: true },
                    { text: 'Business', correct: false },
                    { text: 'Enterprise', correct: false }
                ],
                explanation: 'O plano Developer é o primeiro nível pago, ideal para testes, e oferece suporte técnico via e-mail em horário comercial.'
            },
            { // NOVA PERGUNTA
                question: 'Qual serviço permite consolidar o faturamento de múltiplas contas AWS?',
                answers: [
                    { text: 'AWS Budgets', correct: false },
                    { text: 'AWS Cost Explorer', correct: false },
                    { text: 'AWS Organizations', correct: true },
                    { text: 'AWS IAM', correct: false }
                ],
                explanation: 'O AWS Organizations permite gerenciar múltiplas contas e consolidar o faturamento, o que pode reduzir custos.'
            },
            { // NOVA PERGUNTA
                question: 'Qual modelo de compra oferece desconto de até 75% em troca de um compromisso de uso de 1 ou 3 anos?',
                answers: [
                    { text: 'On-Demand', correct: false },
                    { text: 'Reserved Instances', correct: true },
                    { text: 'Spot Instances', correct: false },
                    { text: 'Plano Basic', correct: false }
                ],
                explanation: 'As Reserved Instances (Instâncias Reservadas) oferecem um grande desconto em troca de um compromisso de uso fixo (1 ou 3 anos).'
            }
        ]
    },
    5: { // Nível 5: Bônus IA/ML
        name: "Nível Bônus: IA/ML",
        questions: [
            {
                question: 'Você precisa "Analisar sentimento de avaliações de clientes". Qual serviço de IA você usa?',
                answers: [
                    { text: 'Amazon Rekognition', correct: false },
                    { text: 'Amazon Comprehend', correct: true },
                    { text: 'Amazon Transcribe', correct: false },
                    { text: 'Amazon SageMaker', correct: false }
                ],
                explanation: 'O Amazon Comprehend é o serviço de Processamento de Linguagem Natural (NLP) usado para analisar textos e detectar sentimentos.'
            },
            {
                question: 'Qual serviço permite "Criar, treinar e implementar modelos de machine learning"?',
                answers: [
                    { text: 'Amazon SageMaker', correct: true },
                    { text: 'Amazon Bedrock', correct: false },
                    { text: 'Amazon Lex', correct: false },
                    { text: 'Amazon Polly', correct: false }
                ],
                explanation: 'O Amazon SageMaker é a plataforma completa de ML, usada para o ciclo de vida completo de criação e treinamento de modelos.'
            },
            {
                question: 'Você quer "Detectar objetos em vídeos de segurança". Qual serviço de IA você usa?',
                answers: [
                    { text: 'Amazon Translate', correct: false },
                    { text: 'Amazon Comprehend', correct: false },
                    { text: 'Amazon Rekognition', correct: true },
                    { text: 'Amazon Polly', correct: false }
                ],
                explanation: 'O Amazon Rekognition é o serviço de visão computacional usado para reconhecer objetos, pessoas e rostos em imagens e vídeos.'
            },
            {
                question: 'Qual serviço dá acesso a modelos de IA generativa (como Claude, Titan)?',
                answers: [
                    { text: 'Amazon SageMaker', correct: false },
                    { text: 'Amazon Bedrock', correct: true },
                    { text: 'Amazon Comprehend', correct: false },
                    { text: 'Amazon Rekognition', correct: false }
                ],
                explanation: 'O Amazon Bedrock é o serviço que fornece acesso a modelos de IA generativa de fundação (Foundation Models) através de uma API.'
            }
        ]
    }
};


// --- Funções do Jogo ---

// Função para mostrar o menu inicial
function showMenu() {
    levelSelectMenu.classList.remove('hide');
    questTitle.innerText = 'Baseado no seu Estudo Turbo';
    questionContainer.classList.add('hide');
    feedbackElement.classList.add('hide');
    nextButton.classList.add('hide');
    backButton.classList.add('hide');
    explanationElement.classList.add('hide');
}

// Função para iniciar um nível do jogo
function startGame(level) {
    // Esconde o menu e mostra o quiz
    levelSelectMenu.classList.add('hide');
    questionContainer.classList.remove('hide');
    backButton.classList.remove('hide');
    
    // Reseta a pontuação
    score = 0;
    updateScoreDisplay();
    
    currentLevelName = allQuestions[level].name;
    questTitle.innerText = `${currentLevelName} (Em Andamento...)`;
    
    // Embaralha as perguntas do nível selecionado
    shuffledQuestions = allQuestions[level].questions.sort(() => Math.random() - 0.5);
    currentQuestionIndex = 0;
    
    setNextQuestion();
}

// Função para carregar a próxima pergunta
function setNextQuestion() {
    resetState();
    if (currentQuestionIndex < shuffledQuestions.length) {
        showQuestion(shuffledQuestions[currentQuestionIndex]);
    } else {
        // --- Fim do Nível ---
        questTitle.innerText = `✨ ${currentLevelName} Completo! ✨`;
        questionContainer.classList.add('hide');
        feedbackElement.innerText = `Você dominou este Domínio! Pontuação Final: ${score} / ${shuffledQuestions.length * 10}`;
        feedbackElement.className = 'feedback-text correct';
        feedbackElement.classList.remove('hide');
        backButton.innerText = 'Escolher outro Nível';
    }
}

// Mostra a pergunta e suas respostas
function showQuestion(question) {
    questionText.innerText = `Pergunta ${currentQuestionIndex + 1}/${shuffledQuestions.length}: ${question.question}`;
    
    // Cria os botões de resposta
    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('btn');
        if (answer.correct) {
            button.dataset.correct = answer.correct;
        }
        button.addEventListener('click', selectAnswer);
        answerButtonsElement.appendChild(button);
    });
}

// Reseta o estado (limpa botões antigos, esconde feedback)
function resetState() {
    nextButton.classList.add('hide');
    feedbackElement.classList.add('hide');
    explanationElement.classList.add('hide'); // Esconde a explicação
    explanationElement.innerText = ''; // Limpa o texto da explicação
    
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

// O que acontece quando o jogador escolhe uma resposta
function selectAnswer(e) {
    const selectedButton = e.target;
    const correct = selectedButton.dataset.correct === "true";
    
    // Mostra o feedback (certo/errado)
    if (correct) {
        feedbackElement.innerText = 'Correto! Você ganhou +10 XP!';
        feedbackElement.className = 'feedback-text correct';
        // Adiciona pontos
        score += 10;
        updateScoreDisplay();
    } else {
        feedbackElement.innerText = 'Errado! Estude este conceito.';
        feedbackElement.className = 'feedback-text wrong';
        
        // NOVO: Mostra a explicação
        const explanation = shuffledQuestions[currentQuestionIndex].explanation;
        explanationElement.innerText = `Explicação: ${explanation}`;
        explanationElement.classList.remove('hide');
    }
    
    feedbackElement.classList.remove('hide');
    
    // Mostra visualmente qual era a correta e a errada
    Array.from(answerButtonsElement.children).forEach(button => {
        setStatusClass(button, button.dataset.correct === "true");
        button.disabled = true; // Desabilita botões após a escolha
    });

    // Mostra o botão de "Próxima"
    nextButton.classList.remove('hide');
}

// Define a cor do botão (verde=certo, vermelho=errado)
function setStatusClass(element, correct) {
    if (correct) {
        element.classList.add('correct');
    } else {
        element.classList.add('wrong');
    }
}

// NOVO: Função para atualizar o placar
function updateScoreDisplay() {
    scoreElement.innerText = score;
}