const express = require('express');
const axios   = require('axios');
const cheerio = require('cheerio');

const app      = express();
const PORT     = process.env.PORT || 3000;
const BASE_URL = 'https://www.agenciabrasilia.df.gov.br';
const URL      = `${BASE_URL}/noticias`;

app.get('/noticias', async (req, res) => {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        const noticias = [];

        // Seleciona cada card de notícia
        $('.content-card-result').each((i, el) => {
            const bloco = $(el).find('a.card-result');

            // Título
            const titulo = bloco.find('h3').text().trim() || null;

            // Label (data/hora e atualização)
            const label = bloco.find('label').text().trim() || null;

            // Descrição (resumo)
            const descricao = bloco
                .find('p.font-weight-regular')
                .text()
                .trim() || null;

            // Imagem (prefixa a URL base)
            let imgSrc = bloco.find('div.col-md-3 img').attr('src') || '';
            if (imgSrc && imgSrc.startsWith('/')) {
                imgSrc = BASE_URL + imgSrc;
            }
            const imagem = imgSrc || null;

            noticias.push({ titulo, label, descricao, imagem });
        });

        res.json(noticias);

    } catch (err) {
        console.error('Erro ao capturar as notícias:', err);
        res.status(500).json({ error: 'Deu ruim ao buscar as notícias 😅' });
    }
});

app.listen(PORT, () => {
    console.log(`🔥 API no ar em http://localhost:${PORT}/noticias`);
});
