# agência-scraper

## Visão Geral

O **agência-scraper** é uma aplicação backend desenvolvida com Node.js, destinada à extração de informações de notícias publicadas no portal da Agência Brasília. A ferramenta implementa um serviço RESTful simples, sem dependência de banco de dados ou autenticação, e retorna os dados no formato JSON.

## Funcionalidades

* **Extração de dados**: Captura de título, data e hora de publicação e atualização, descrição e URL da imagem de cada notícia.
* **Endpoint único**: Disponibilização da rota HTTP GET `/noticias` que retorna um vetor de objetos JSON, contendo os seguintes campos:

  * `titulo` (string): título da notícia.
  * `label` (string): informação de data e hora de publicação e atualização.
  * `descricao` (string): resumo ou subtítulo da notícia.
  * `imagem` (string): URL absoluta da imagem associada.

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
  node index.js
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
    "imagem": "https://www.agenciabrasilia.df.gov.br/documents/d/guest/whatsapp-image-2025-05-01-at-15-47-02-jpeg?imageThumbnail=4"
  },
  ...
]
```

## Estrutura do Projeto

```
agencia-scraper/
├── index.js        # Ponto de entrada da API
├── package.json    # Metadados e dependências
└── .gitignore      # Arquivos e pastas ignorados pelo Git
```

## Considerações Finais

Este projeto foi concebido para fornecer uma solução leve, de fácil manutenção e de rápida integração a outros sistemas que exijam informações de notícias da Agência Brasília.

## Contribuição

Contribuições, sugestões e correções são bem-vindas. Abra *issues* ou envie *pull requests* para aprimorar o projeto.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
