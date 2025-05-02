// index.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'noticias.json');

let noticiasCache = [];

function loadNoticias() {
	try {
		const raw = fs.readFileSync(DATA_PATH, 'utf-8');
		noticiasCache = JSON.parse(raw);
		console.log(`✔️  Loaded ${noticiasCache.length} notícias`);
	} catch (err) {
		console.error(`❌ Erro ao carregar noticias.json:`, err.message);
		noticiasCache = [];
	}
}
loadNoticias();

app.get('/noticias', (_req, res) => {
	if (!noticiasCache.length) {
		return res
			.status(503)
			.json({
				error: 'Dados indisponíveis. Tente novamente mais tarde.',
			});
	}
	res.json(noticiasCache);
});

app.listen(PORT, () => {
	console.log(`🚀 API rodando em http://localhost:${PORT}/noticias`);
});
