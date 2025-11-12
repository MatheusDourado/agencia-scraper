const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dns').setDefaultResultOrder('ipv4first');


const URL = 'https://www.agenciabrasilia.df.gov.br/noticias';
const OUTPUT = path.join(__dirname, '../noticias.json');

const headers = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
	'Cache-Control': 'no-cache',
	Pragma: 'no-cache',
};

async function scrapeNoticias() {
	try {
		console.log(`Buscando notícias de ${URL}...`);

		const { data } = await axios.get(URL, {
			headers,
			timeout: 15000,
			maxRedirects: 5,
		});

		const $ = cheerio.load(data);
		const noticias = [];

		$('.content-card-result a.card-result').each((index, element) => {
			try {
				const $card = $(element);

				const titulo = $card.find('h3')?.text()?.trim() || '';
				const data = $card.find('label')?.text()?.trim() || '';
				const descricao =
					$card.find('.font-weight-regular')?.text()?.trim() || '';

				let link = $card.attr('href') || '';
				let imagem = $card.find('.col-md-3 img')?.attr('src') || '';

				if (link && !link.startsWith('http')) {
					link = `https://www.agenciabrasilia.df.gov.br${link}`;
				}
				if (imagem && !imagem.startsWith('http')) {
					imagem = `https://www.agenciabrasilia.df.gov.br${imagem}`;
				}

				if (titulo && link) {
					noticias.push({
						titulo,
						data,
						descricao,
						link,
						imagem,
					});
				}
			} catch (error) {
				console.warn(`Erro ao processar card ${index}:`, error.message);
			}
		});

		if (noticias.length === 0) {
			throw new Error(
				'Nenhuma notícia encontrada! Verifique os seletores CSS.',
			);
		}

		fs.writeFileSync(OUTPUT, JSON.stringify(noticias, null, 2), 'utf8');
		console.log(`Sucesso: ${noticias.length} notícias salvas!`);

		return noticias;
	} catch (error) {
		console.error('Erro durante o scraping:', error.message);
		throw error;
	}
}

async function runWithRetry(maxTries = 3) {
	for (let i = 1; i <= maxTries; i++) {
		try {
			console.log(`\nTentativa ${i} de ${maxTries}`);
			await scrapeNoticias();
			process.exit(0);
			return;
		} catch (err) {
			if (i === maxTries) {
				console.error(`Falhou após ${maxTries} tentativas`);
				process.exit(1);
			}

			const delay = Math.pow(2, i) * 1000;
			console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
}

runWithRetry(3);
