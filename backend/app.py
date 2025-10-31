from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models import db, Tentativa
import os
import time

app = Flask(__name__)

# --- Configuração ---
# Permite que o frontend (ex: http://127.0.0.1:5500) acesse o backend
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

@app.route('/historico', methods=['POST'])
def add_historico():
    """Salva uma nova tentativa no banco de dados."""
    try:
        dados = request.get_json()
        
        # Validação simples
        if not dados or 'topico' not in dados:
            return jsonify({'erro': 'Dados incompletos'}), 400

        nova_tentativa = Tentativa(
            data=dados.get('data'),
            topico=dados.get('topico'),
            acertos=dados.get('acertos'),
            total=dados.get('total'),
            percentual=dados.get('percentual')
        )
        
        db.session.add(nova_tentativa)
        db.session.commit()
        
        return jsonify(nova_tentativa.to_json()), 201 # 201 = Created
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

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