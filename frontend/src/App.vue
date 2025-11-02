<script setup>
import { ref, onMounted, computed } from 'vue'

// --- CONSTANTES ---
const SEGUNDOS_POR_QUESTAO = 90; // Seu tempo de 90s
const API_URL = 'http://127.0.0.1:5000/historico';

// --- ESTADO DA UI ---
const telaAtual = ref('selecao'); // 'selecao', 'jogo', 'resultado'
const historicoCarregando = ref(true);
const erroHistorico = ref(null);
const respostaDada = ref(false);

// --- NÍVEIS ---
// Suas listas de tópicos e simulados (está ótimo!)
const niveisTopicos = ref([
  { level: 'conceitos', titulo: '1. Conceitos de Nuvem', icon: 'mdi-cloud-question' },
  { level: 'seguranca', titulo: '2. Segurança e Conformidade', icon: 'mdi-shield-check' },
  { level: 'tecnologia', titulo: '3. Tecnologia e Serviços', icon: 'mdi-server' },
  { level: 'faturamento', titulo: '4. Faturamento e Suporte', icon: 'mdi-currency-usd' },
  { level: 'ia_ml', titulo: '5. IA / Machine Learning', icon: 'mdi-brain' },
  { level: 'completo', titulo: 'Simulado Rápido', icon: 'mdi-rocket-launch' },
]);

const niveisSimulados = ref([
  { level: 'simulado_1', titulo: 'Simulado 01', icon: 'mdi-numeric-1-box', disabled: false },
  { level: 'simulado_2', titulo: 'Simulado 02', icon: 'mdi-numeric-2-box', disabled: true }, 
  { level: 'simulado_3', titulo: 'Simulado 03', icon: 'mdi-numeric-3-box', disabled: true },
  { level: 'simulado_4', titulo: 'Simulado 04', icon: 'mdi-numeric-4-box', disabled: true },
  { level: 'simulado_5', titulo: 'Simulado 05', icon: 'mdi-numeric-5-box', disabled: true },
]);


// --- ESTADO DO JOGO ---
const allQuestions = ref({});
const currentQuestions = ref([]);
const currentIndex = ref(0);
const score = ref(0);
const currentLevel = ref('');
const nomeNivelAtual = ref('');
const modoTesteTitulo = ref('');
const questoesErradas = ref([]);
const questoesParaRevisar = ref([]);
const historicoTentativas = ref([]);
// CORREÇÃO: O nome da chave no JSON é 'respostaCorreta'.
const perguntaAtual = ref({ pergunta: '', opcoes: [], respostaCorreta: '' }); 
const opcoesEmbaralhadas = ref([]);
const respostasSelecionadas = ref([]); // Isto está correto (sempre um array)

// --- ESTADO DO TIMER ---
const timerInterval = ref(null);
const timeLeft = ref(0);

// --- ESTADO DO RESULTADO ---
const resultadoTitulo = ref('');
const resultadoFinalTexto = ref('');
const resultadoFeedback = ref('');


// --- INICIALIZAÇÃO ---
onMounted(async () => {
  try {
    const response = await fetch('/questoes.json'); 
    if (!response.ok) throw new Error('Falha ao carregar questoes.json.');
    allQuestions.value = await response.json();

    // Sua lógica para habilitar os botões (ótima!)
    niveisSimulados.value.forEach(nivel => {
      if (allQuestions.value[nivel.level] && allQuestions.value[nivel.level].length > 0) {
        nivel.disabled = false;
      }
    });

  } catch (error) {
    console.error("Erro ao carregar questões:", error);
    erroHistorico.value = "Falha crítica ao carregar questões. Recarregue a página.";
  }
  await loadHistoryFromBackend();
});

// --- LÓGICA DO JOGO ---
function startGame(level, levelTitle) {
  clearInterval(timerInterval.value);
  currentIndex.value = 0;
  score.value = 0;
  questoesErradas.value = [];
  currentLevel.value = level;
  nomeNivelAtual.value = levelTitle;

  if (level === 'revisao') {
    currentQuestions.value = [...questoesParaRevisar.value];
    modoTesteTitulo.value = `Modo de Revisão (${currentQuestions.value.length}q)`;
  } else if (level === 'completo') {
    // CORREÇÃO: O simulado rápido 'completo' não deve incluir os simulados grandes
    // Vamos pegar apenas os tópicos
    currentQuestions.value = [
      ...allQuestions.value.conceitos,
      ...allQuestions.value.seguranca,
      ...allQuestions.value.tecnologia,
      ...allQuestions.value.faturamento,
      ...allQuestions.value.ia_ml
    ];
    modoTesteTitulo.value = levelTitle;
  } else {
    // Isso funciona para os tópicos E para os simulados (ex: 'simulado_1')
    currentQuestions.value = allQuestions.value[level] ? [...allQuestions.value[level]] : [];
    modoTesteTitulo.value = levelTitle;
  }

  if (level !== 'revisao') {
    currentQuestions.value.sort(() => Math.random() - 0.5);
  }

  // Config Timer
  timeLeft.value = currentQuestions.value.length * (level === 'revisao' ? 120 : SEGUNDOS_POR_QUESTAO);
  startTimer();

  // Mudar tela
  telaAtual.value = 'jogo';
  resultadoTitulo.value = "Simulado Concluído!";
  showQuestion();
}

function showQuestion() {
  if (currentIndex.value < currentQuestions.value.length) {
    perguntaAtual.value = currentQuestions.value[currentIndex.value];
    opcoesEmbaralhadas.value = [...perguntaAtual.value.opcoes].sort(() => Math.random() - 0.5);
    respostaDada.value = false;
    respostasSelecionadas.value = []; // Limpa seleções
  } else {
    showResult("completed");
  }
}

// ########## CORREÇÃO PRINCIPAL AQUI ##########
// Lógica de confirmação que lida com STRING (única) e ARRAY (múltipla)
function confirmarResposta() {
  respostaDada.value = true;
  clearInterval(timerInterval.value); // Pausa o timer ao responder

  const corretas = perguntaAtual.value.respostaCorreta;
  const selecionadas = respostasSelecionadas.value.sort();
  let isCorrect = false;

  if (Array.isArray(corretas)) {
    // Lógica para MÚLTIPLA ESCOLHA (comparar arrays)
    const sortedCorretas = [...corretas].sort();
    isCorrect = JSON.stringify(sortedCorretas) === JSON.stringify(selecionadas);
  } else {
    // Lógica para ESCOLHA ÚNICA (comparar string com array[0])
    // O usuário só pode selecionar 1 opção se a resposta não for um array
    isCorrect = selecionadas.length === 1 && selecionadas[0] === corretas;
  }
  
  if (isCorrect) {
    score.value++;
  } else {
    questoesErradas.value.push(perguntaAtual.value);
  }

  // Vai para a próxima pergunta após 2 segundos de feedback visual
  setTimeout(() => {
    currentIndex.value++;
    showQuestion();
    if (telaAtual.value === 'jogo') {
      startTimer();
    }
  }, 2500); // 2.5 segundos de feedback visual
}
// ########## FIM DA CORREÇÃO PRINCIPAL ##########


async function showResult(motivo) {
  clearInterval(timerInterval.value);
  questoesParaRevisar.value = [...questoesErradas.value];

  if (motivo === "time_out") resultadoTitulo.value = "Tempo Esgotado! ⌛";
  else if (motivo === "quit") resultadoTitulo.value = "Simulado Interrompido";
  else resultadoTitulo.value = "Simulado Concluído!";

  const total = currentQuestions.value.length;
  const percentual = total > 0 ? Math.round((score.value / total) * 100) : 0;
  
  resultadoFinalTexto.value = `Você acertou ${score.value} de ${total} questões (${percentual}%)`;

  if (percentual === 100) resultadoFeedback.value = "Excelente! Você gabaritou! 🚀";
  else if (percentual >= 70) resultadoFeedback.value = "Ótimo trabalho! Você está no caminho certo!";
  else if (percentual >= 50) resultadoFeedback.value = "Bom esforço! Continue revisando.";
  else resultadoFeedback.value = "Não desanime! Revise os pontos e tente novamente.";

  // Salva no DB
  if (currentLevel.value !== 'revisao' && motivo !== 'quit') {
    const novoResultado = {
      data: new Date().toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      topico: nomeNivelAtual.value.replace("🚀 ", ""), 
      acertos: score.value,
      total: total,
      percentual: percentual
    };
    await saveHistoryToBackend(novoResultado);
  }
  
  telaAtual.value = 'resultado';
}

function goHome() {
  clearInterval(timerInterval.value);
  
  if (telaAtual.value === 'jogo') {
    showResult("quit");
  } else {
    telaAtual.value = 'selecao';
  }
  
  loadHistoryFromBackend();
  questoesErradas.value = [];
  questoesParaRevisar.value = [];
}

function startReviewMode() {
  startGame('revisao', `Modo de Revisão`);
}

// --- LÓGICA DO TIMER ---
function startTimer() {
  timerInterval.value = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval.value);
      confirmarResposta(); // Confirma a resposta atual (mesmo que vazia) quando o tempo acaba
    }
  }, 1000);
}

const formatTimer = computed(() => {
  const minutos = Math.floor(timeLeft.value / 60);
  const segundos = timeLeft.value % 60;
  return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
});

// --- LÓGICA DO "DB" (API) ---
async function saveHistoryToBackend(novoResultado) {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoResultado),
    });
  } catch (error) {
    console.error("Erro ao salvar no back-end:", error);
  }
}

async function loadHistoryFromBackend() {
  historicoCarregando.value = true;
  erroHistorico.value = null;
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Falha ao carregar histórico (API offline?).');
    historicoTentativas.value = await response.json();
  } catch (error) {
    console.error("Erro ao carregar do back-end:", error);
    erroHistorico.value = "Erro ao carregar histórico. O back-end (Docker) está rodando?";
  } finally {
    historicoCarregando.value = false;
  }
}

// --- LÓGICA DE ESTILO (CLASSES) ---
function getPercentClass(percentual) {
  if (percentual >= 70) return 'text-success font-weight-bold';
  if (percentual >= 50) return 'text-warning font-weight-bold';
  return 'text-error font-weight-bold';
}

// CORREÇÃO: Função atualizada para usar 'respostaCorreta' e 'Array.isArray'
function getOptionColor(opcao) {
  if (!respostaDada.value) return 'primary'; // Cor padrão antes da resposta
  
  const corretas = perguntaAtual.value.respostaCorreta;
  
  if (Array.isArray(corretas)) {
    // Lógica de Múltipla Escolha
    if (corretas.includes(opcao)) return 'success';
    if (respostasSelecionadas.value.includes(opcao)) return 'error';
  } else {
    // Lógica de Escolha Única
    if (corretas === opcao) return 'success';
    if (respostasSelecionadas.value.includes(opcao)) return 'error';
  }
  return 'grey'; // Cor para opções não selecionadas e erradas
}

// CORREÇÃO: Função atualizada para usar 'respostaCorreta' e 'Array.isArray'
function getOptionClass(opcao) {
  if (!respostaDada.value) return ''; // Nenhuma classe extra antes da resposta
  
  const corretas = perguntaAtual.value.respostaCorreta;
  
  if (Array.isArray(corretas)) {
    // Lógica de Múltipla Escolha
    if (corretas.includes(opcao)) return 'bg-success-lighten-2 border-success';
    if (respostasSelecionadas.value.includes(opcao)) return 'bg-error-lighten-2 border-error';
  } else {
    // Lógica de Escolha Única
    if (corretas === opcao) return 'bg-success-lighten-2 border-success';
    if (respostasSelecionadas.value.includes(opcao)) return 'bg-error-lighten-2 border-error';
  }
  return 'opacity-50'; // Opções não selecionadas
}

niveisSimulados.value.forEach(nivel => {
  if (allQuestions.value[nivel.level] && allQuestions.value[nivel.level].length > 0) {
    nivel.disabled = false;
  }
});

</script>