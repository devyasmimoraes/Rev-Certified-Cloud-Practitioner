<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            
            <h1 class="text-h3 text-center mb-4" style="color: #FF9900">
              <v-icon>mdi-cloud-outline</v-icon> AWS Quest - Simulado
            </h1>

            <v-card v-if="telaAtual === 'selecao'" elevation="2" class="pa-5">
              <v-card-title class="text-h5 mb-4">Escolha um tópico ou simulado:</v-card-title>
              
              <v-list lines="one" subheader>
                <v-list-subheader>SIMULADOS COMPLETOS (65 Questões)</v-list-subheader>
                <v-list-item
                  v-for="nivel in niveisSimulados"
                  :key="nivel.level"
                  @click="startGame(nivel.level, nivel.titulo)"
                  :prepend-icon="nivel.icon"
                  :title="nivel.titulo"
                  color="primary"
                  class="mb-2"
                  variant="outlined"
                  ripple
                  :disabled="nivel.disabled"
                ></v-list-item>
              </v-list>
              
              <v-list lines="one" subheader class="mt-4">
                <v-list-subheader>TÓPICOS DE REVISÃO</v-list-subheader>
                <v-list-item
                  v-for="nivel in niveisTopicos"
                  :key="nivel.level"
                  @click="startGame(nivel.level, nivel.titulo)"
                  :prepend-icon="nivel.icon"
                  :title="nivel.titulo"
                  color="secondary"
                  class="mb-2"
                  variant="outlined"
                  ripple
                ></v-list-item>
              </v-list>
              
              <v-divider class="my-4"></v-divider>
              <h3 class="text-h6 text-center mb-3">Histórico de Tentativas</h3>
              <v-card variant="outlined">
                <v-progress-linear v-if="historicoCarregando" indeterminate color="primary"></v-progress-linear>
                <v-alert v-if="erroHistorico" type="error" variant="tonal" dense>{{ erroHistorico }}</v-alert>
                <v-table v-if="historicoTentativas.length > 0" density="compact">
                  <thead>
                    <tr><th class="text-left">Data</th><th class="text-left">Tópico</th><th class="text-left">Resultado</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in historicoTentativas.slice(0, 10)" :key="item.id">
                      <td>{{ item.data }}</td>
                      <td>{{ item.topico }}</td>
                      <td><span :class="getPercentClass(item.percentual)">{{ item.acertos }}/{{ item.total }} ({{ item.percentual }}%)</span></td>
                    </tr>
                  </tbody>
                </v-table>
                <v-card-text v-else-if="!historicoCarregando && !erroHistorico" class="text-center text-grey">
                  Nenhuma tentativa registrada no banco de dados.
                </v-card-text>
              </v-card>
            </v-card>

            <v-card v-if="telaAtual === 'jogo'" elevation="2">
              <v-toolbar color="secondary" dark dense>
                <v-toolbar-title class="text-body-1">{{ modoTesteTitulo }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-chip prepend-icon="mdi-timer-outline" :color="timeLeft <= 30 ? 'red-darken-2' : 'secondary'" variant="flat">
                  {{ formatTimer }}
                </v-chip>
                <v-chip class="ml-2" prepend-icon="mdi-check-decagram" color="secondary" variant="flat">
                  Pontos: {{ score }}
                </v-chip>
              </v-toolbar>

              <v-progress-linear :model-value="(currentIndex / currentQuestions.length) * 100" color="primary"></v-progress-linear>

              <v-card-text class="pa-5">
                <p class="text-grey-darken-1 mb-4">Questão {{ currentIndex + 1 }} de {{ currentQuestions.length }}</p>
                <h3 class="text-h5 mb-6" style="line-height: 1.5;">{{ perguntaAtual.pergunta }}</h3>
                
                <div id="opcoes-container">
                  <v-checkbox
                    v-for="(opcao, index) in opcoesEmbaralhadas"
                    :key="index"
                    v-model="respostasSelecionadas"
                    :label="opcao"
                    :value="opcao"
                    :color="getOptionColor(opcao)"
                    :disabled="respostaDada"
                    :class="getOptionClass(opcao)"
                    hide-details
                    class="mb-3 pa-3"
                    variant="outlined"
                    rounded="lg"
                  ></v-checkbox>
                </div>
              </v-card-text>

              <v-card-actions class="pa-4 d-flex justify-space-between">
                <v-btn @click="goHome" color="grey" variant="text">Sair e Voltar</v-btn>
                <v-btn
                  @click="confirmarResposta"
                  :disabled="respostaDada || respostasSelecionadas.length === 0"
                  color="primary"
                  variant="flat"
                  size="large"
                >
                  Confirmar Resposta
                </v-btn>
              </v-card-actions>
            </v-card>

            <v-card v-if="telaAtual === 'resultado'" elevation="2" class="pa-5 text-center">
              <v-card-title class="text-h4 mb-3">{{ resultadoTitulo }}</v-card-title>
              <v-card-text>
                <p class="text-h5 mb-2">{{ resultadoFinalTexto }}</p>
                <p class="text-h6 text-medium-emphasis">{{ resultadoFeedback }}</p>
              </v-card-text>

              <v-card-actions class="d-flex flex-column ga-3 pa-4">
                <v-btn
                  v-if="questoesParaRevisar.length > 0"
                  @click="startReviewMode"
                  color="blue-darken-2"
                  variant="flat"
                  size="large"
                  block
                  prepend-icon="mdi-history"
                >
                  Revisar {{ questoesParaRevisar.length }} Questões Erradas
                </v-btn>
                <v-btn
                  @click="startGame(currentLevel, nomeNivelAtual)"
                  color="primary"
                  variant="flat"
                  size="large"
                  block
                  prepend-icon="mdi-reload"
                >
                  Tentar Novamente (Mesmo Teste)
                </v-btn>
                <v-btn @click="goHome" color="grey" variant="text" size="large" block>
                  Voltar ao Início
                </v-btn>
              </v-card-actions>
            </v-card>

          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// *********** 🔥 CORREÇÃO 3: IMPORTAR O WATCH 🔥 ***********
import { ref, onMounted, computed, watch } from 'vue'

// --- CONSTANTES ---
const SEGUNDOS_POR_QUESTAO = 90; // Seu tempo de 90s
const API_URL = 'http://127.0.0.1:5000/historico';

// --- ESTADO DA UI ---
const telaAtual = ref('selecao'); // 'selecao', 'jogo', 'resultado'
const historicoCarregando = ref(true);
const erroHistorico = ref(null);
const respostaDada = ref(false);

// --- NÍVEIS ---
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
const perguntaAtual = ref({ pergunta: '', opcoes: [], respostaCorreta: '' }); 
const opcoesEmbaralhadas = ref([]);
const respostasSelecionadas = ref([]); 

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
    // Simulado Rápido (apenas tópicos)
    currentQuestions.value = [
      ...allQuestions.value.conceitos,
      ...allQuestions.value.seguranca,
      ...allQuestions.value.tecnologia,
      ...allQuestions.value.faturamento,
      ...allQuestions.value.ia_ml
    ];
    modoTesteTitulo.value = levelTitle;
  } else {
    // Tópicos e Simulados
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


// *********** 🔥 CORREÇÃO 3: LÓGICA DE SELEÇÃO MOVIDA PARA UM WATCHER 🔥 ***********
watch(respostasSelecionadas, (novasRespostas, respostasAntigas) => {
  if (respostaDada.value) return; // Não faz nada se a resposta já foi dada

  // Descobre se a pergunta atual é de escolha única ou múltipla
  const corretas = perguntaAtual.value.respostaCorreta;
  const tipo = Array.isArray(corretas) ? 'multipla' : 'unica';

  if (tipo === 'unica' && novasRespostas.length > 1) {
    // Se for 'unica' e o usuário tentar marcar a segunda (ex: ['A', 'B'])
    // Mantenha apenas a última resposta selecionada.
    respostasSelecionadas.value = [novasRespostas[novasRespostas.length - 1]];
  }
});
// **********************************************************************************


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

// *********** 🔥 CORREÇÃO 2: VERIFICAÇÃO DE ERRO NO POST 🔥 ***********
async function saveHistoryToBackend(novoResultado) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoResultado),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Falha no POST: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    console.log("Histórico salvo com sucesso!");
    
  } catch (error) {
    console.error("Erro ao salvar no back-end:", error);
    erroHistorico.value = "Ocorreu um erro ao salvar seu resultado.";
  }
}
// ************************************************************************

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

// *********** 🔥 CORREÇÃO 1: ESTILO DE SELEÇÃO 🔥 ***********
function getOptionClass(opcao) {
  // 1. Feedback IMEDIATO ao selecionar (antes de confirmar)
  if (!respostaDada.value) {
    if (respostasSelecionadas.value.includes(opcao)) {
      return 'bg-primary-lighten-2 border-primary'; 
    }
    return ''; // Padrão (não selecionado)
  }

  // 2. Feedback PÓS-RESPOSTA (correto/incorreto)
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
</script>

<style>
/* Estilos globais para a fonte e background */
html, body, #app {
  background-color: #f4f6f8;
  font-family: 'Roboto', sans-serif;
}
/* Classes utilitárias do Vuetify */
.bg-success-lighten-2 { background-color: #E8F5E9 !important; }
.border-success { border: 1px solid #4CAF50 !important; }
.bg-error-lighten-2 { background-color: #FFEBEE !important; }
.border-error { border: 1px solid #F44336 !important; }
.opacity-50 { opacity: 0.6; }
.text-wrap { white-space: normal !important; }


/* *********** 🔥 CORREÇÃO 1: CLASSES DE ESTILO 🔥 *********** */
.bg-primary-lighten-2 {
  background-color: #E3F2FD !important; /* Azul bem claro */
}
.border-primary {
  border: 1px solid #2196F3 !important; /* Borda azul */
}
/* *************************************************************** */


/* Estilo para o checkbox parecer um botão */
.v-checkbox.v-input--density-default {
  --v-input-control-height: auto;
  --v-input-padding-top: 0;
}
.v-checkbox .v-selection-control__input {
  display: none; /* Esconde o checkbox real */
}
.v-checkbox .v-label {
  opacity: 1 !important;
  width: 100%;
}
.v-checkbox .v-selection-control__wrapper {
  margin-right: -10px; /* Remove espaço do checkbox escondido */
}
</style>