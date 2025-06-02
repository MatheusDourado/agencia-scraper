const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
	const BASE_URL = 'https://www.agenciabrasilia.df.gov.br';
	const URL = `${BASE_URL}/noticias`;

	const browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	const page = await browser.newPage();

	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
	await page.goto(URL, { waitUntil: 'networkidle2' });

	const lista = await page.evaluate((BASE_URL) => {
		const listaNoticias = [];
		document.querySelectorAll('.content-card-result').forEach(el => {
			const bloco = el.querySelector('a.card-result');
			const titulo = bloco?.querySelector('h3')?.innerText.trim() || null;
			const label = bloco?.querySelector('label')?.innerText.trim() || null;
			const descricao = bloco?.querySelector('p.font-weight-regular')?.innerText.trim() || null;

			let link = bloco?.getAttribute('href') || '';
			if (link && link.startsWith('/')) link = BASE_URL + link;

			let imgSrc = bloco?.querySelector('div.col-md-3 img')?.getAttribute('src') || '';
			if (imgSrc && imgSrc.startsWith('/')) imgSrc = BASE_URL + imgSrc;

			listaNoticias.push({
				titulo,
				label,
				descricao,
				imagem: imgSrc || null,
				link
			});
		});
		return listaNoticias;
	}, BASE_URL);

	const filePath = path.resolve(__dirname, '..', 'noticias.json');
	fs.writeFileSync(filePath, JSON.stringify(lista, null, 2), 'utf-8');
	console.log(`✅ Gerado noticias.json com ${lista.length} itens`);
	await browser.close();
	process.exit(0);
})();
