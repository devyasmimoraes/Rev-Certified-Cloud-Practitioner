from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Tentativa(db.Model):
    # Define as colunas da nossa tabela
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(50), nullable=False)
    topico = db.Column(db.String(100), nullable=False)
    acertos = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    percentual = db.Column(db.Integer, nullable=False)

    # Função para converter o objeto em um JSON
    def to_json(self):
        return {
            'id': self.id,
            'data': self.data,
            'topico': self.topico,
            'acertos': self.acertos,
            'total': self.total,
            'percentual': self.percentual
        }