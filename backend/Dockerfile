# Usar uma imagem base oficial do Python
FROM python:3.9-slim

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar o arquivo de dependências
COPY requirements.txt .

# Instalar as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o resto do código do backend para o container
COPY . .

# Expor a porta 5000 (que o Flask usará)
EXPOSE 5000

# Comando para rodar a aplicação quando o container iniciar
CMD ["python", "app.py"]