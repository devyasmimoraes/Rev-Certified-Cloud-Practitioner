from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Tentativa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(50), nullable=False)
    topico = db.Column(db.String(100), nullable=False)
    acertos = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    percentual = db.Column(db.Integer, nullable=False)

    # NOVO: Relacionamento para acessar todas as respostas desta tentativa
    # Isso cria uma "coluna virtual" .respostas
    respostas = db.relationship('Resposta', backref='tentativa', lazy=True)

    def to_json(self):
        return {
            'id': self.id,
            'data': self.data,
            'topico': self.topico,
            'acertos': self.acertos,
            'total': self.total,
            'percentual': self.percentual
        }

# NOVA TABELA: Para salvar cada resposta individual
class Resposta(db.Model):
    __tablename__ = 'resposta' # Nome explícito da tabela
    
    id = db.Column(db.Integer, primary_key=True)
    
    # 'questao_id' será o ID da pergunta do seu 'questoes.json'
    questao_id = db.Column(db.String(50), nullable=False) 
    
    foi_correta = db.Column(db.Boolean, nullable=False)
    
    # Chave estrangeira para ligar esta resposta a uma Tentativa
    tentativa_id = db.Column(db.Integer, db.ForeignKey('tentativa.id'), nullable=False)

    def to_json(self):
        return {
            'id': self.id,
            'questao_id': self.questao_id,
            'foi_correta': self.foi_correta,
            'tentativa_id': self.tentativa_id
        }