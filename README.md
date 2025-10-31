AWS Quest - Simulado Cloud Practitioner ☁️
Este é um projeto de simulado de ponta a ponta (full-stack) para estudos da certificação AWS Certified Cloud Practitioner (CLF-C02).

Ele utiliza um front-end moderno com Vue.js + Vuetify e um back-end robusto com Python (Flask) e um banco de dados PostgreSQL para persistir o histórico de tentativas. Todo o ambiente é orquestrado com Docker.

🛠️ Tecnologias Utilizadas
Front-end:

Vue.js 3 (Composition API)

Vuetify 3 (Framework de UI Material Design)

Vite (Build tool)

Back-end:

Python 3.9+

Flask (Para a API REST)

SQLAlchemy (ORM para o banco)

Banco de Dados:

PostgreSQL (Para salvar o histórico de simulados)

Ambiente & Orquestração:

Docker

Docker Compose

📁 Estrutura do Projeto
/REV-CERTIFIED-CLOUD-PRACTITIONER
├── backend/
│   ├── app.py          # Servidor Flask (API)
│   ├── models.py       # Modelo da tabela do banco
│   ├── requirements.txt  # Dependências Python
│   └── Dockerfile        # Receita do container do back-end
│
├── frontend/
│   ├── public/
│   │   └── questoes.json # O arquivo de questões do simulado
│   ├── src/
│   │   ├── plugins/
│   │   │   └── vuetify.js  # Configuração do Vuetify
│   │   ├── App.vue         # Componente principal do Vue
│   │   └── main.js         # Ponto de entrada do Vue
│   └── package.json      # Dependências do Front-end
│
└── docker-compose.yml    # Orquestrador (inicia o back-end e o db)
🚀 Como Rodar o Projeto
Para rodar este projeto, você precisará de dois terminais abertos: um para o back-end (Docker) e outro para o front-end (Vite/Vue).

Pré-requisitos
Docker & Docker Compose (O docker compose com espaço)

Node.js (LTS) (que inclui o npm)

Terminal 1: Iniciando o Back-end (API + Banco de Dados)
Abra seu primeiro terminal na pasta raiz do projeto (~/Rev-Certified-Cloud-Practitioner).

Inicie os containers do back-end e do banco de dados em modo "detached" (segundo plano):

Bash

docker compose up --build -d
O comando --build só é necessário na primeira vez ou se você fizer alterações no back-end (ex: app.py, requirements.txt).

O -d (detached) roda os containers em segundo plano e libera seu terminal.

Seu back-end agora está rodando em http://127.0.0.1:5000.

Terminal 2: Iniciando o Front-end (Interface do Usuário)
Abra um segundo terminal (no VS Code, clique no + no painel do terminal).

Navegue até a pasta frontend:

Bash

cd frontend
(Se for a primeira vez) Instale as dependências do Node.js (Vue, Vuetify, etc.):

Bash

npm install
Inicie o servidor de desenvolvimento do Vue (Vite):

Bash

npm run dev
3. Acesse o Aplicativo
O Terminal 2 (do front-end) mostrará uma mensagem similar a:

  ➜  Local:   http://localhost:5173/
Abra o link http://localhost:5173/ no seu navegador.

Pronto! Seu simulado está no ar, com o front-end bonito do Vuetify se comunicando com seu back-end Python/Postgres.

🛑 Como Parar o Projeto
Parar o Front-end: Pressione Ctrl+C no Terminal 2.

Parar o Back-end (API e DB): No Terminal 1 (na pasta raiz), rode:

Bash

docker compose down
(Seus dados do Postgres serão preservados no volume do Docker, prontos para a próxima vez que você usar docker compose up).