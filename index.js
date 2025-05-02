// index.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://www.agenciabrasilia.df.gov.br';
const URL = `${BASE_URL}/noticias`;

// cache in-memory: guarda 5 minutos
const cache = new NodeCache({ stdTTL: 60 * 5, checkperiod: 60 });

// variável que armazena o batch gerado pelo cron
let noticiasCache = [];

// Função que faz o scraping e retorna o array de notícias
async function fetchNoticias() {
	const { data } = await axios.get(URL);
	const $ = cheerio.load(data);
	const lista = [];

	$('.content-card-result').each((i, el) => {
		const bloco = $(el).find('a.card-result');
		const titulo = bloco.find('h3').text().trim() || null;
		const label = bloco.find('label').text().trim() || null;
		const descricao =
			bloco.find('p.font-weight-regular').text().trim() || null;
		let imgSrc = bloco.find('div.col-md-3 img').attr('src') || '';
		if (imgSrc.startsWith('/')) imgSrc = BASE_URL + imgSrc;
		lista.push({ titulo, label, descricao, imagem: imgSrc || null });
	});

	return lista;
}

// Cron job: atualiza o cache a cada 10 minutos
cron.schedule('*/10 * * * *', async () => {
	try {
		console.log('🕒 [cron] Atualizando cache de notícias…');
		noticiasCache = await fetchNoticias();
		cache.set('noticias', noticiasCache); // opcional: duplica no node-cache
		console.log(
			'✅ [cron] Cache atualizado com',
			noticiasCache.length,
			'itens',
		);
	} catch (err) {
		console.error('[cron] Erro ao atualizar cache:', err.message);
	}
});

// Endpoint: serve JSON já pronto
app.get('/noticias', (req, res) => {
	// se tiver no node-cache e for recente, serve direto
	const hit = cache.get('noticias');
	if (hit) {
		console.log('🔁 Servindo do cache in-memory');
		return res.json(hit);
	}
	// senão, serve o batch do cron (se existir)
	if (noticiasCache.length) {
		console.log('🔁 Servindo do cache pré-bitado pelo cron');
		cache.set('noticias', noticiasCache);
		return res.json(noticiasCache);
	}
	// última alternativa: faz scraping na hora
	fetchNoticias()
		.then((lista) => {
			cache.set('noticias', lista);
			res.json(lista);
		})
		.catch((err) => {
			console.error('❌ Erro scraping on-the-fly:', err.message);
			res.status(500).json({ error: 'Erro ao obter notícias' });
		});
});

app.listen(PORT, () => {
	console.log(`🚀 API rodando em http://localhost:${PORT}/noticias`);
});
