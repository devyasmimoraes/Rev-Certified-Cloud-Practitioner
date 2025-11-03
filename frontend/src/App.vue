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
                    <tr>
                      <th class="text-left">Data</th>
                      <th class="text-left">Tópico</th>
                      <th class="text-left">Resultado</th>
                      <th class="text-left">Ações</th> </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in historicoTentativas.slice(0, 10)" :key="item.id">
                      <td>{{ item.data }}</td>
                      <td>{{ item.topico }}</td>
                      <td><span :class="getPercentClass(item.percentual)">{{ item.acertos }}/{{ item.total }} ({{ item.percentual }}%)</span></td>
                      
                      <td>
                        <v-btn
                          v-if="item.percentual < 100"
                          @click="iniciarRefazer(item.id, item.topico)"
                          color="blue-darken-2"
                          variant="text"
                          size="small"
                          density="compact"
                          prepend-icon="mdi-history"
                        >
                          Refazer Erradas
                        </v-btn>
                      </td>
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

// --- (Constantes, Estado UI, Níveis) ---
const SEGUNDOS_POR_QUESTAO = 90;
// --- 🔥 MUDANÇA: URLs da API centralizadas ---
const API_BASE_URL = 'http://127.0.0.1:5000';
const API_HISTORICO_URL = `${API_BASE_URL}/historico`;
const API_QUESTOES_URL = `${API_BASE_URL}/api/questoes`;
// --- FIM DA MUDANÇA ---

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

// --- (Estado do Jogo, Timer, Resultado) ---
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
const perguntaAtual = ref({ id: '', pergunta: '', opcoes: [], respostaCorreta: '' }); 
const opcoesEmbaralhadas = ref([]);
const respostasSelecionadas = ref([]); 
// --- 🔥 NOVO: Armazena todas as respostas (certas e erradas) ---
const respostasDaTentativa = ref([]);
// --- FIM DA MUDANÇA ---
const timerInterval = ref(null);
const timeLeft = ref(0);
const resultadoTitulo = ref('');
const resultadoFinalTexto = ref('');
const resultadoFeedback = ref('');
const resultadoAnalisePilares = ref([]);


// --- 🔥 MUDANÇA: 'onMounted' agora busca questões da API ---
onMounted(async () => {
  try {
    // 1. Buscar da API (http://127.0.0.1:5000/api/questoes)
    const response = await fetch(API_QUESTOES_URL); 
    if (!response.ok) throw new Error('Falha ao carregar questoes.json da API.');
    
    // 2. A API retorna uma LISTA PLANA de todas as questões
    const allQuestionsList = await response.json();
    const processedData = {};
    
    // 3. Re-agrupar as questões nos tópicos (usando o 'level' que adicionamos no app.py)
    niveisTopicos.value.forEach(topico => {
      processedData[topico.level] = allQuestionsList
        .filter(q => q.level === topico.level)
        .map(q => ({
          ...q,
          categoria: q.categoria || topico.titulo 
        }));
    });

    // 4. Re-agrupar as questões nos simulados
    niveisSimulados.value.forEach(simulado => {
      processedData[simulado.level] = allQuestionsList
        .filter(q => q.level === simulado.level)
        .map(q => ({
          ...q,
          categoria: q.categoria || "Tópico Misto"
        }));
        
      if (processedData[simulado.level].length > 0) {
        simulado.disabled = false;
      }
    });

    allQuestions.value = processedData; 
    
  } catch (error) {
    console.error("Erro ao carregar questões:", error);
    erroHistorico.value = "Falha crítica ao carregar questões da API. O Docker está rodando?";
  }
  await loadHistoryFromBackend();
});
// --- FIM DA MUDANÇA ---


// --- 🔥 MUDANÇA: 'startGame' agora reseta a lista de respostas ---
function startGame(level, levelTitle) {
  clearInterval(timerInterval.value);
  currentIndex.value = 0;
  score.value = 0;
  questoesErradas.value = [];
  respostasDaTentativa.value = []; // <-- NOVO: Reseta a lista de respostas
  currentLevel.value = level;
  nomeNivelAtual.value = levelTitle;

  if (level === 'revisao') {
    // Se for 'revisao', as questões vêm do 'questoesParaRevisar'
    // que é preenchido pelo 'iniciarRefazer' ou 'startReviewMode'
    currentQuestions.value = [...questoesParaRevisar.value];
    modoTesteTitulo.value = `${levelTitle} (${currentQuestions.value.length}q)`;
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
// --- FIM DA MUDANÇA ---


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


// --- 🔥 MUDANÇA: 'confirmarResposta' agora salva CADA resposta ---
function confirmarResposta() {
  respostaDada.value = true;
  clearInterval(timerInterval.value); 

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

  // --- 🔥 NOVO: Salva o resultado (certo OU errado) na lista ---
  respostasDaTentativa.value.push({
    id: String(perguntaAtual.value.id), // Garante que o ID é string
    foi_correta: isCorrect
  });
  // --- FIM DA MUDANÇA ---
}

function proximaQuestao() {
  currentIndex.value++;
  showQuestion(); 
  if (telaAtual.value === 'jogo') {
    startTimer(); 
  }
}

// --- 🔥 MUDANÇA: 'showResult' envia o payload NOVO para a API ---
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

  // ... (Lógica de análise de pilares - sem mudança) ...
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
  // --- FIM Lógica de análise ---

  if (currentLevel.value !== 'revisao' && motivo !== 'quit' && total > 0) {
    
    // --- 🔥 MUDANÇA: Cria o payload no NOVO formato ---
    const payloadParaApi = {
      topico: nomeNivelAtual.value.replace("🚀 ", ""), 
      respostas: [...respostasDaTentativa.value] // Envia a lista completa de respostas
    };
    await saveHistoryToBackend(payloadParaApi); // Passa o novo payload
    // --- FIM DA MUDANÇA ---
  }
  
  telaAtual.value = 'resultado';
}
// --- FIM DA MUDANÇA ---


function goHome() {
  clearInterval(timerInterval.value);
  if (telaAtual.value === 'jogo') {
    showResult("quit");
  } else {
    telaAtual.value = 'selecao';
  }
  loadHistoryFromBackend(); // Recarrega o histórico
  questoesErradas.value = [];
  questoesParaRevisar.value = [];
  resultadoAnalisePilares.value = [];
}

function startReviewMode() {
  // Reutiliza as questões erradas da tela de resultado
  startGame('revisao', `Modo de Revisão`);
}

// --- (Lógica do Timer - Sem Mudanças) ---
function startTimer() {
  timerInterval.value = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval.value);
      confirmarResposta(); 
    }
  }, 1000);
}
const formatTimer = computed(() => {
  const minutos = Math.floor(timeLeft.value / 60);
  const segundos = timeLeft.value % 60;
  return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
});
// --- FIM Lógica do Timer ---


// --- 🔥 MUDANÇA: Funções de API ---

// 'saveHistoryToBackend' agora recebe 'payload'
async function saveHistoryToBackend(payload) {
  try {
    const response = await fetch(API_HISTORICO_URL, { // Usa a nova constante
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), // Envia o payload (formato novo)
    });
    if (!response.ok) {
      const errorData = await response.json();
      // O erro 400 que você via apareceria aqui
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
    const response = await fetch(API_HISTORICO_URL); // Usa a nova constante
    if (!response.ok) throw new Error('Falha ao carregar histórico (API offline?).');
    historicoTentativas.value = await response.json();
  } catch (error) {
    console.error("Erro ao carregar do back-end:", error);
    erroHistorico.value = "Erro ao carregar histórico. O back-end (Docker) está rodando?";
  } finally {
    historicoCarregando.value = false;
  }
}

// --- 🔥 FUNÇÃO NOVA: 'iniciarRefazer' ---
async function iniciarRefazer(idTentativa, nomeTopico) {
  historicoCarregando.value = true; // Mostra o loading
  erroHistorico.value = null;
  try {
    // 1. Chamar o novo endpoint do backend
    const response = await fetch(`${API_BASE_URL}/tentativa/${idTentativa}/refazer`);
    if (!response.ok) throw new Error('Falha ao buscar questões para refazer.');

    const questoesParaRefazerApi = await response.json();

    if (questoesParaRefazerApi.length > 0) {
      // 2. Coloca as questões recebidas da API no 'questoesParaRevisar'
      //    Adiciona 'categoria' para a tela de resultados da revisão
      questoesParaRevisar.value = questoesParaRefazerApi.map(q => ({
          ...q,
          categoria: q.categoria || "Revisão de Erradas" 
      }));

      // 3. Chame 'startGame' com o level 'revisao'
      startGame('revisao', `Revisão: ${nomeTopico}`);
      
    } else {
      alert('Não há questões erradas para refazer nesta tentativa!');
    }
  } catch (error) {
    console.error('Erro ao iniciar modo "Refazer":', error);
    erroHistorico.value = "Erro ao carregar questões para refazer.";
  } finally {
    historicoCarregando.value = false;
  }
}
// --- FIM DA FUNÇÃO NOVA ---

// --- (Lógica de Estilos - Sem Mudanças) ---
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