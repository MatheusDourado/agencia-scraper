# agência-scraper

## Visão Geral

O **agência-scraper** é uma aplicação backend desenvolvida com Node.js, destinada à extração de informações de notícias publicadas no portal da Agência Brasília. A ferramenta implementa um serviço RESTful simples, sem dependência de banco de dados ou autenticação, e retorna os dados no formato JSON.

## Funcionalidades

* **Extração de dados**: Captura de título, data e hora de publicação/atualização, descrição, URL da imagem e URL da notícia (campo `link`).
* **Endpoint único**: rota HTTP GET `/noticias` que retorna um vetor de objetos JSON, contendo os seguintes campos:

  * `titulo` (string): título da notícia.
  * `label` (string): informação de data e hora de publicação e atualização.
  * `descricao` (string): resumo ou subtítulo da notícia.
  * `imagem` (string): URL absoluta da imagem associada.
  * `link` (string): URL absoluta para leitura completa da notícia no site da Agência Brasília.

## Tecnologias Utilizadas

* **Node.js** (v14+): ambiente de execução JavaScript no servidor.
* **Express**: framework minimalista para criação de APIs RESTful.
* **Axios**: cliente HTTP para requisições ao portal de notícias.
* **Cheerio**: biblioteca para parsing de HTML e extração de dados, com sintaxe semelhante ao jQuery.

## Pré-requisitos

* **Node.js** (versão 14 ou superior)
* **NPM** (gerenciador de pacotes do Node)

## Instalação

1. **Clone** o repositório:

   ```bash
   git clone https://github.com/SEU_USUARIO/agencia-scraper.git
   ```
2. Acesse o diretório do projeto:

   ```bash
   cd agencia-scraper
   ```
3. **Instale** as dependências:

   ```bash
   npm install
   ```

## Configuração e Execução

* **Variável de ambiente** (opcional): Defina `PORT` para especificar a porta de execução (o padrão é `3000`):

  ```bash
  export PORT=8080
  ```
* **Inicie** o servidor:

  ```bash
  npm start
  ```

Ao iniciar, a aplicação exibirá uma mensagem indicando a porta em que está escutando.

## Uso

Após o servidor estar em execução, basta realizar uma requisição HTTP GET para o endpoint:

```
GET http://localhost:3000/noticias
```

**Exemplo de resposta:**

```json
[
  {
    "titulo": "Renova DF já capacitou 727 pessoas em situação de rua",
    "label": "01/05/2025 às 18h27 - Atualizado em 01/05/2025 às 18h27",
    "descricao": "Iniciativa conta com uma reserva de vagas para essa população; Censo Distrital da População em Situação de Rua mostra impacto de políticas deste GDF para esse público",
    "imagem": "https://www.agenciabrasilia.df.gov.br/documents/d/guest/whatsapp-image-2025-05-01-at-15-47-02-jpeg?imageThumbnail=4",
    "link": "https://www.agenciabrasilia.df.gov.br/w/renova-df-ja-capacitou-727-pessoas-em-situacao-de-rua?redirect=%2Fnoticias"
  },
  ...
]
```

## Estrutura do Projeto

```
agencia-scraper/
├── index.js                # Ponto de entrada da API (lê JSON estático)
├── scripts/
│   └── fetchNoticias.js    # Scraper que gera o noticias.json
├── noticias.json           # JSON estático com dados de notícias
├── package.json            # Metadados e dependências
└── .github/
    └── workflows/
        └── generate-noticias.yml   # Workflow Action para regenerar JSON
```

## Considerações Finais

Este projeto foi concebido para fornecer uma solução leve, de fácil manutenção e de rápida integração a outros sistemas que exijam informações de notícias da Agência Brasília. O campo `link` permite navegação direta até a matéria original, podendo ser aberto em nova aba (`target="_blank"`).

---

## Workflow GitHub Actions

A cada hora (ou manualmente via trigger), um workflow do GitHub Actions executa o script de scraping, gera o `noticias.json` e faz commit automático. Segue a configuração em `.github/workflows/generate-noticias.yml`:

```yaml
permissions:
  contents: write

name: Generate noticias.json

on:
  schedule:
    - cron: '0 * * * *'     # roda a cada hora
  workflow_dispatch:       # permite disparo manual

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run scraper to generate JSON
        run: npm run generate-json

      - name: Commit and push noticias.json
        uses: EndBug/add-and-commit@v9
        with:
          author_name: github-actions
          author_email: actions@github.com
          message: 'chore: update noticias.json'
          add: 'noticias.json'
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

As permissões de conteúdo (`permissions.contents: write`) e `GITHUB_TOKEN` garantem que o workflow tenha autorização para commitar e enviar o arquivo atualizado ao repositório.

## Contribuição

Contribuições, sugestões e correções são bem-vindas. Abra *issues* ou envie *pull requests* para aprimorar o projeto.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
