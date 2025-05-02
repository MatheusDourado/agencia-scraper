// scripts/fetchNoticias.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.agenciabrasilia.df.gov.br';
const URL = `${BASE_URL}/noticias`;

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

(async () => {
	try {
		const noticias = await fetchNoticias();
		const filePath = path.resolve(__dirname, '..', 'noticias.json');
		fs.writeFileSync(filePath, JSON.stringify(noticias, null, 2), 'utf-8');
		console.log(`✅ notícias.json gerado com ${noticias.length} itens`);
		process.exit(0);
	} catch (err) {
		console.error('❌ Erro ao gerar noticias.json:', err);
		process.exit(1);
	}
})();
