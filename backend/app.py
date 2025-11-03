from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models import db, Tentativa, Resposta # <-- MODIFICADO
import os
import time
import json # <-- MODIFICADO
from datetime import datetime # <-- MODIFICADO

app = Flask(__name__)

# --- Configuração ---
CORS(app) 

# Configuração do Banco de Dados (lendo do Docker environment)
db_user = os.environ.get('POSTGRES_USER')
db_pass = os.environ.get('POSTGRES_PASSWORD')
db_name = os.environ.get('POSTGRES_DB')
db_host = 'db' # Nome do serviço do Postgres no docker-compose.yml

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{db_user}:{db_pass}@{db_host}:5432/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa o DB
db.init_app(app)

# Função para tentar conectar ao DB com retries
def init_db_connection(max_retries=5, delay=5):
    retries = 0
    with app.app_context():
        while retries < max_retries:
            try:
                # Tenta criar as tabelas
                db.create_all()
                print("Conexão com o banco de dados estabelecida e tabelas criadas.")
                return True
            except Exception as e:
                retries += 1
                print(f"Erro ao conectar ao DB: {e}. Tentativa {retries}/{max_retries}. Aguardando {delay}s...")
                time.sleep(delay)
        print("Não foi possível conectar ao banco de dados após várias tentativas.")
        return False

# --- Rotas (Endpoints da API) ---

@app.route('/historico', methods=['GET'])
def get_historico():
    """Retorna todas as tentativas salvas, da mais nova para a mais antiga."""
    try:
        # Ordena por ID decrescente para pegar os mais novos primeiro
        tentativas = Tentativa.query.order_by(Tentativa.id.desc()).all()
        return jsonify([t.to_json() for t in tentativas])
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

# --- ROTA MODIFICADA ---
@app.route('/historico', methods=['POST'])
def add_historico():
    """
    Salva uma nova tentativa E SUAS RESPOSTAS no banco de dados.
    O frontend deve enviar: { "topico": "...", "respostas": [...] }
    Onde respostas = [ { "id": "1", "foi_correta": true }, ... ]
    """
    try:
        dados = request.get_json()
        
        # Validação nova
        if not dados or 'topico' not in dados or 'respostas' not in dados:
            return jsonify({'erro': 'Dados incompletos. "topico" e "respostas" são obrigatórios.'}), 400

        lista_respostas = dados.get('respostas', [])
        topico = dados.get('topico')
        
        # 1. Calcular o score AQUI, no backend
        acertos = sum(1 for r in lista_respostas if r.get('foi_correta', False))
        total = len(lista_respostas)
        percentual = int((acertos / total) * 100) if total > 0 else 0
        data_hoje = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 2. Criar a Tentativa (tabela principal)
        nova_tentativa = Tentativa(
            data=data_hoje, # Gerar data no backend é mais confiável
            topico=topico,
            acertos=acertos,
            total=total,
            percentual=percentual
        )
        
        db.session.add(nova_tentativa)
        # Commit para obter o ID da nova_tentativa
        db.session.commit() 

        # 3. Salvar cada resposta individual na tabela 'Resposta'
        for resposta in lista_respostas:
            # Validar se a resposta tem os campos necessários
            if 'id' in resposta and 'foi_correta' in resposta:
                nova_resposta = Resposta(
                    questao_id=str(resposta['id']), # Pega o ID da questão (como string)
                    foi_correta=resposta['foi_correta'], # Pega se acertou
                    tentativa_id=nova_tentativa.id # Linka com a tentativa
                )
                db.session.add(nova_resposta)
        
        # 4. Commit final para salvar todas as 'Respostas'
        db.session.commit()
        
        return jsonify(nova_tentativa.to_json()), 201 # 201 = Created
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

# --- FUNÇÃO MODIFICADA ---
def carregar_questoes():
    """Função helper para carregar o JSON de questões."""
    try:
        # Procura o arquivo dentro da pasta 'backend'
        with open('questoes.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Se o JSON for um dicionário de tópicos (ex: {"Conceitos": [...], "Seguranca": [...]})
            if isinstance(data, dict):
                all_questions = []
                for key in data:
                    # MODIFICADO: Adiciona a 'level' (chave) em cada objeto de questão
                    for question in data[key]:
                        question['level'] = key 
                        all_questions.append(question)
                return all_questions
            # Se o JSON for apenas uma lista plana de questões
            elif isinstance(data, list):
                return data
            else:
                return []
                
    except FileNotFoundError:
        print("ERRO: 'questoes.json' não encontrado na pasta 'backend'.")
        return []
    except Exception as e:
        print(f"Erro ao carregar 'questoes.json': {e}")
        return []

# --- ROTA NOVA ---
@app.route('/tentativa/<int:id_tentativa>/refazer', methods=['GET'])
def refazer_simulado(id_tentativa):
    """Retorna uma lista de questões que o usuário errou em uma tentativa."""
    try:
        # 1. Buscar no banco todas as respostas erradas daquela tentativa
        respostas_erradas = Resposta.query.filter_by(
            tentativa_id=id_tentativa,
            foi_correta=False
        ).all()
        
        # 2. Pegar os IDs (como string) das questões erradas
        ids_questoes_erradas = set(r.questao_id for r in respostas_erradas)
        
        if not ids_questoes_erradas:
            return jsonify([]) # Retorna lista vazia se não há o que refazer

        # 3. Carregar o 'questoes.json'
        todas_questoes = carregar_questoes()
        if not todas_questoes:
            return jsonify({'erro': 'Arquivo de questões não encontrado no servidor'}), 500
        
        # 4. Filtrar a lista de questões
        questoes_para_refazer = [
            q for q in todas_questoes 
            if str(q.get('id')) in ids_questoes_erradas
        ]
        
        return jsonify(questoes_para_refazer)
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

# --- ROTA NOVA ---
@app.route('/api/questoes', methods=['GET'])
def get_questoes():
    """Retorna a lista completa de questões do JSON."""
    questoes = carregar_questoes()
    if not questoes:
        return jsonify({'erro': 'Arquivo de questões não encontrado no servidor'}), 500
    return jsonify(questoes) # Retorna a lista plana


# Rota de "saúde" para verificar se a API está no ar
@app.route('/')
def health_check():
    return jsonify({"status": "API está no ar!"})


if __name__ == '__main__':
    # Tenta conectar ao banco antes de iniciar o servidor
    if init_db_connection():
        # O 'host=0.0.0.0' é crucial para o Docker
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("Falha ao iniciar o servidor Flask: não foi possível conectar ao DB.")