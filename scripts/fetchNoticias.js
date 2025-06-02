const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.agenciabrasilia.df.gov.br';
const URL = `${BASE_URL}/noticias`;

async function fetchNoticias() {
	const headers = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
		Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
		Referer: BASE_URL,
		Connection: 'keep-alive',
	};

	const { data } = await axios.get(URL, { headers });
	const $ = cheerio.load(data);
	const lista = [];

	$('.content-card-result').each((_, el) => {
		const bloco = $(el).find('a.card-result');
		const titulo = bloco.find('h3').text().trim() || null;
		const label = bloco.find('label').text().trim() || null;
		const descricao =
			bloco.find('p.font-weight-regular').text().trim() || null;

		// captura o link e garante URL absoluta
		let link = bloco.attr('href') || '';
		if (link.startsWith('/')) link = BASE_URL + link;

		let imgSrc = bloco.find('div.col-md-3 img').attr('src') || '';
		if (imgSrc.startsWith('/')) imgSrc = BASE_URL + imgSrc;

		lista.push({
			titulo,
			label,
			descricao,
			imagem: imgSrc || null,
			link,
		});
	});

	return lista;
}

(async () => {
	try {
		const noticias = await fetchNoticias();
		const filePath = path.resolve(__dirname, '..', 'noticias.json');
		fs.writeFileSync(filePath, JSON.stringify(noticias, null, 2), 'utf-8');
		console.log(`✅ Gerado noticias.json com ${noticias.length} itens`);
		process.exit(0);
	} catch (err) {
		console.error('❌ Erro ao gerar noticias.json:', err.message);
		process.exit(1);
	}
})();
