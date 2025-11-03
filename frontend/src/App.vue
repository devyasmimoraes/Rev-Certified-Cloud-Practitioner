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
                  v-if="!respostaDada"
                  @click="confirmarResposta"
                  :disabled="respostasSelecionadas.length === 0"
                  color="primary"
                  variant="flat"
                  size="large"
                >
                  Confirmar Resposta
                </v-btn>

                <v-btn
                  v-if="respostaDada"
                  @click="proximaQuestao"
                  color="success"
                  variant="flat"
                  size="large"
                >
                  Próxima Questão
                  <v-icon end>mdi-arrow-right-thick</v-icon>
                </v-btn>

              </v-card-actions>
            </v-card>

            <v-card v-if="telaAtual === 'resultado'" elevation="2" class="pa-5">
              <v-card-title class="text-h4 mb-3 text-center">{{ resultadoTitulo }}</v-card-title>
              <v-card-text class="text-center">
                <p class="text-h5 mb-2">{{ resultadoFinalTexto }}</p>
                <p class="text-h6 text-medium-emphasis">{{ resultadoFeedback }}</p>
              </v-card-text>
              <v-divider class="my-4" v-if="resultadoAnalisePilares.length > 0"></v-divider>
              <v-card-text v-if="resultadoAnalisePilares.length > 0">
                <h4 class="text-h6 mb-3 text-left">Análise de Erros por Pilar:</h4>
                <v-list lines="two" density="compact" class="bg-transparent">
                  <v-list-item
                    v-for="pilar in resultadoAnalisePilares"
                    :key="pilar.nome"
                    :title="pilar.nome"
                    :subtitle="`Você errou ${pilar.contagem} questão(ões) deste tópico.`"
                    class="mb-2"
                    variant="outlined"
                    rounded="lg"
                  >
                    <template v-slot:append>
                      <v-progress-circular
                        :model-value="pilar.percentual"
                        :color="pilar.percentual >= 50 ? 'error' : 'warning'"
                        size="50"
                        width="5"
                      >
                        <small><strong>{{ pilar.percentual }}%</strong></small>
                      </v-progress-circular>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
              <v-divider class="my-4" v-if="questoesParaRevisar.length > 0"></v-divider>
              <v-card-text v-if="questoesParaRevisar.length > 0">
                <h4 class="text-h6 mb-4 text-left">Resumo das Questões Erradas:</h4>
                <v-expansion-panels variant="inset" class="mb-4">
                  <v-expansion-panel
                    v-for="(q, index) in questoesParaRevisar"
                    :key="index"
                  >
                    <v-expansion-panel-title class="text-error">
                      <v-icon start>mdi-close-circle-outline</v-icon>
                      <span class="text-wrap"><strong>Questão:</strong> {{ q.pergunta.substring(0, 60) }}...</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <p class="mb-3"><strong>Pergunta Completa:</strong> {{ q.pergunta }}</p>
                      <v-list density="compact" class="bg-transparent">
                        <v-list-item
                          v-for="(opcao, i) in q.opcoes"
                          :key="i"
                          :class="getClasseRevisao(opcao, q.respostaCorreta, q.respostaUsuario)"
                          class="pa-3 mb-2 text-wrap"
                          rounded="lg"
                          style="border: 1px solid #eee;"
                        >
                          <v-list-item-title class="text-wrap">{{ opcao }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
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
                  Revisar {{ questoesParaRevisar.length }} Questões Erradas (Modo Focado)
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
import { ref, onMounted, computed, watch } from 'vue'

// --- (Constantes, Estado UI, Níveis - Sem Mudanças) ---
const SEGUNDOS_POR_QUESTAO = 90;
const API_URL = 'http://127.0.0.1:5000/historico';
const telaAtual = ref('selecao');
const historicoCarregando = ref(true);
const erroHistorico = ref(null);
const respostaDada = ref(false);
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

// --- (Estado do Jogo, Timer, Resultado - Sem Mudanças) ---
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
const timerInterval = ref(null);
const timeLeft = ref(0);
const resultadoTitulo = ref('');
const resultadoFinalTexto = ref('');
const resultadoFeedback = ref('');
const resultadoAnalisePilares = ref([]);


// --- (onMounted - Sem Mudanças) ---
onMounted(async () => {
  try {
    const response = await fetch('/questoes.json'); 
    if (!response.ok) throw new Error('Falha ao carregar questoes.json.');
    
    const data = await response.json();
    const processedData = {};
    
    niveisTopicos.value.forEach(topico => {
      if (data[topico.level]) {
        processedData[topico.level] = data[topico.level].map(q => ({
          ...q,
          categoria: q.categoria || topico.titulo 
        }));
      }
    });

    niveisSimulados.value.forEach(simulado => {
      if (data[simulado.level]) {
        processedData[simulado.level] = data[simulado.level].map(q => ({
          ...q,
          categoria: q.categoria || "Tópico Misto"
        }));
        simulado.disabled = false;
      }
    });

    allQuestions.value = processedData; 
  } catch (error) {
    console.error("Erro ao carregar questões:", error);
    erroHistorico.value = "Falha crítica ao carregar questões. Recarregue a página.";
  }
  await loadHistoryFromBackend();
});

// --- (startGame, showQuestion, watch - Sem Mudanças) ---
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
    currentQuestions.value = [
      ...(allQuestions.value.conceitos || []),
      ...(allQuestions.value.seguranca || []),
      ...(allQuestions.value.tecnologia || []),
      ...(allQuestions.value.faturamento || []),
      ...(allQuestions.value.ia_ml || [])
    ];
    modoTesteTitulo.value = levelTitle;
  } else {
    currentQuestions.value = allQuestions.value[level] ? [...allQuestions.value[level]] : [];
    modoTesteTitulo.value = levelTitle;
  }

  if (level !== 'revisao') {
    currentQuestions.value.sort(() => Math.random() - 0.5);
  }

  timeLeft.value = currentQuestions.value.length * (level === 'revisao' ? 120 : SEGUNDOS_POR_QUESTAO);
  startTimer();
  telaAtual.value = 'jogo';
  resultadoTitulo.value = "Simulado Concluído!";
  showQuestion();
}

function showQuestion() {
  if (currentIndex.value < currentQuestions.value.length) {
    perguntaAtual.value = currentQuestions.value[currentIndex.value];
    opcoesEmbaralhadas.value = [...perguntaAtual.value.opcoes].sort(() => Math.random() - 0.5);
    respostaDada.value = false;
    respostasSelecionadas.value = [];
  } else {
    showResult("completed");
  }
}

watch(respostasSelecionadas, (novasRespostas, respostasAntigas) => {
  if (respostaDada.value) return; 
  const corretas = perguntaAtual.value.respostaCorreta;
  const tipo = Array.isArray(corretas) ? 'multipla' : 'unica';
  if (tipo === 'unica' && novasRespostas.length > 1) {
    respostasSelecionadas.value = [novasRespostas[novasRespostas.length - 1]];
  }
});


// *********** 🔥 FUNÇÃO 'confirmarResposta' MODIFICADA 🔥 ***********
function confirmarResposta() {
  respostaDada.value = true;
  clearInterval(timerInterval.value); // Pausa o timer

  const corretas = perguntaAtual.value.respostaCorreta;
  const selecionadas = respostasSelecionadas.value.sort();
  let isCorrect = false;

  if (Array.isArray(corretas)) {
    const sortedCorretas = [...corretas].sort();
    isCorrect = JSON.stringify(sortedCorretas) === JSON.stringify(selecionadas);
  } else {
    isCorrect = selecionadas.length === 1 && selecionadas[0] === corretas;
  }
  
  if (isCorrect) {
    score.value++;
  } else {
    questoesErradas.value.push({
      ...perguntaAtual.value,
      respostaUsuario: [...selecionadas] 
    });
  }

  // O setTimeout foi REMOVIDO daqui.
  // O app agora espera o usuário clicar em "Próxima Questão".
}

// *********** 🔥 NOVA FUNÇÃO: 'proximaQuestao' 🔥 ***********
function proximaQuestao() {
  currentIndex.value++;
  showQuestion(); // Carrega a próxima questão ou chama showResult()
  if (telaAtual.value === 'jogo') {
    startTimer(); // Reinicia o timer para a nova questão
  }
}

// --- (showResult, goHome, startReviewMode - Sem Mudanças) ---
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

  const contagemErros = {};
  questoesParaRevisar.value.forEach(q => {
    const categoria = q.categoria || "Outros"; 
    contagemErros[categoria] = (contagemErros[categoria] || 0) + 1;
  });

  if (questoesParaRevisar.value.length > 0) {
    resultadoAnalisePilares.value = Object.entries(contagemErros)
      .map(([nome, contagem]) => ({
        nome,
        contagem,
        percentual: Math.round((contagem / questoesParaRevisar.value.length) * 100)
      }))
      .sort((a, b) => b.contagem - a.contagem); 
  } else {
    resultadoAnalisePilares.value = [];
  }

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
  resultadoAnalisePilares.value = [];
}

function startReviewMode() {
  startGame('revisao', `Modo de Revisão`);
}

// --- (Lógica do Timer - Sem Mudanças) ---
function startTimer() {
  timerInterval.value = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval.value);
      confirmarResposta(); // Ainda confirma automaticamente se o tempo acabar
    }
  }, 1000);
}

const formatTimer = computed(() => {
  const minutos = Math.floor(timeLeft.value / 60);
  const segundos = timeLeft.value % 60;
  return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
});

// --- (Lógica de API e Estilos - Sem Mudanças) ---
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

function getPercentClass(percentual) {
  if (percentual >= 70) return 'text-success font-weight-bold';
  if (percentual >= 50) return 'text-warning font-weight-bold';
  return 'text-error font-weight-bold';
}

function getOptionColor(opcao) {
  if (!respostaDada.value) return 'primary'; 
  const corretas = perguntaAtual.value.respostaCorreta;
  if (Array.isArray(corretas)) {
    if (corretas.includes(opcao)) return 'success';
    if (respostasSelecionadas.value.includes(opcao)) return 'error';
  } else {
    if (corretas === opcao) return 'success';
    if (respostasSelecionadas.value.includes(opcao)) return 'error';
  }
  return 'grey';
}

function getOptionClass(opcao) {
  if (!respostaDada.value) {
    if (respostasSelecionadas.value.includes(opcao)) {
      return 'bg-primary-lighten-2 border-primary'; 
    }
    return '';
  }
  const corretas = perguntaAtual.value.respostaCorreta;
  if (Array.isArray(corretas)) {
    if (corretas.includes(opcao)) return 'bg-success-lighten-2 border-success';
    if (respostasSelecionadas.value.includes(opcao)) return 'bg-error-lighten-2 border-error';
  } else {
    if (corretas === opcao) return 'bg-success-lighten-2 border-success';
    if (respostasSelecionadas.value.includes(opcao)) return 'bg-error-lighten-2 border-error';
  }
  return 'opacity-50';
}

function getClasseRevisao(opcao, respostaCorreta, respostaUsuario) {
  const corretas = Array.isArray(respostaCorreta) ? respostaCorreta : [respostaCorreta];
  const usuario = Array.isArray(respostaUsuario) ? respostaUsuario : []; 

  if (corretas.includes(opcao)) {
    return 'bg-success-lighten-2'; 
  }
  if (usuario.includes(opcao)) {
    return 'bg-error-lighten-2'; 
  }
  return ''; 
}

</script>

<style>
/* ... (Seu CSS anterior - Nenhuma mudança aqui) ... */
html, body, #app {
  background-color: #f4f6f8;
  font-family: 'Roboto', sans-serif;
}
.bg-success-lighten-2 { background-color: #E8F5E9 !important; }
.border-success { border: 1px solid #4CAF50 !important; }
.bg-error-lighten-2 { background-color: #FFEBEE !important; }
.border-error { border: 1px solid #F44336 !important; }
.opacity-50 { opacity: 0.6; }
.text-wrap { white-space: normal !important; }

.bg-primary-lighten-2 {
  background-color: #E3F2FD !important;
}
.border-primary {
  border: 1px solid #2196F3 !important;
}

.v-checkbox.v-input--density-default {
  --v-input-control-height: auto;
  --v-input-padding-top: 0;
}
.v-checkbox .v-selection-control__input {
  display: none; 
}
.v-checkbox .v-label {
  opacity: 1 !important;
  width: 100%;
}
.v-checkbox .v-selection-control__wrapper {
  margin-right: -10px; 
}

.v-expansion-panel-title .text-wrap {
  white-space: normal !important;
  flex: 1 1 auto;
}
</style>