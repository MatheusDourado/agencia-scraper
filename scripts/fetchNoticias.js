const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.agenciabrasilia.df.gov.br/noticias';
const OUTPUT = path.join(__dirname, '../noticias.json');

// Headers realistas para evitar bloqueios
const headers = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
	'Cache-Control': 'no-cache',
	Pragma: 'no-cache',
	Referer: 'https://www.agenciabrasilia.df.gov.br/',
};

async function scrapeNoticias() {
	try {
		console.log(`🔄 Buscando notícias de ${URL}...`);

		const response = await axios.get(URL, {
			headers,
			timeout: 15000, // 15 segundos
			maxRedirects: 5,
		});

		const $ = cheerio.load(response.data);
		const noticias = [];

		// Ajusta os seletores conforme necessário
		$('.content-card-result a.card-result').each((index, element) => {
			try {
				const $card = $(element);

				const titulo = $card.find('h3')?.text()?.trim() || '';
				const data = $card.find('label')?.text()?.trim() || '';
				const descricao =
					$card.find('.font-weight-regular')?.text()?.trim() || '';

				let link = $card.attr('href') || '';
				let imagem = $card.find('.col-md-3 img')?.attr('src') || '';

				// Corrige URLs relativas
				if (link && !link.startsWith('http')) {
					link = `https://www.agenciabrasilia.df.gov.br${link}`;
				}
				if (imagem && !imagem.startsWith('http')) {
					imagem = `https://www.agenciabrasilia.df.gov.br${imagem}`;
				}

				if (titulo && link) {
					// Valida se tem pelo menos título e link
					noticias.push({
						titulo,
						data,
						descricao,
						link,
						imagem,
					});
				}
			} catch (error) {
				console.warn(
					`⚠️ Erro ao processar card ${index}:`,
					error.message,
				);
			}
		});

		if (noticias.length === 0) {
			throw new Error(
				'❌ Nenhuma notícia encontrada! Verifique os seletores CSS.',
			);
		}

		// Salva JSON
		fs.writeFileSync(OUTPUT, JSON.stringify(noticias, null, 2), 'utf8');
		console.log(`✅ ${noticias.length} notícias salvas com sucesso!`);

		return noticias;
	} catch (error) {
		console.error('❌ Erro durante o scraping:', error.message);
		throw error;
	}
}

// Retry automático com backoff exponencial
async function runWithRetry(maxTries = 3) {
	for (let i = 1; i <= maxTries; i++) {
		try {
			console.log(`\n📍 Tentativa ${i} de ${maxTries}`);
			await scrapeNoticias();
			process.exit(0);
			return;
		} catch (err) {
			if (i === maxTries) {
				console.error(`\n❌ Falhou em todas as ${maxTries} tentativas`);
				process.exit(1);
			}

			const delay = Math.pow(2, i) * 1000; // Backoff: 2s, 4s, 8s
			console.log(
				`⏳ Aguardando ${delay}ms antes da próxima tentativa...`,
			);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
}

runWithRetry(3);
    
