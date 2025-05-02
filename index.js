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

// In‐memory cache: guarda por 5 minutos
const cache = new NodeCache({ stdTTL: 60 * 5, checkperiod: 60 });

// Guarda o batch gerado pelo cron
let noticiasCache = [];

// Função de scraping
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

// 🚀 [boot] Faz pré‐scraping inicial
(async () => {
	try {
		console.log('🚀 [boot] Fazendo pré-scraping inicial…');
		noticiasCache = await fetchNoticias();
		cache.set('noticias', noticiasCache);
		console.log(
			'✅ [boot] Cache inicial OK:',
			noticiasCache.length,
			'notícias',
		);
	} catch (e) {
		console.error('[boot] falha no cache inicial:', e.message);
	}
})();

// Cron job: atualiza o cache a cada 10 minutos
cron.schedule('*/10 * * * *', async () => {
	try {
		console.log('🕒 [cron] Atualizando cache de notícias…');
		noticiasCache = await fetchNoticias();
		cache.set('noticias', noticiasCache);
		console.log(
			'✅ [cron] Cache atualizado com',
			noticiasCache.length,
			'itens',
		);
	} catch (err) {
		console.error('[cron] Erro ao atualizar cache:', err.message);
	}
});

// Endpoint: serve JSON rapidinho
app.get('/noticias', (req, res) => {
	const hit = cache.get('noticias');
	if (hit) {
		console.log('🔁 Servindo do cache in-memory');
		return res.json(hit);
	}
	if (noticiasCache.length) {
		console.log('🔁 Servindo do cache pré-bitado pelo cron');
		cache.set('noticias', noticiasCache);
		return res.json(noticiasCache);
	}
	// fallback: scraping on-the-fly
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
