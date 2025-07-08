const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const URL = 'https://www.agenciabrasilia.df.gov.br/noticias';
const OUTPUT = path.join(__dirname, '../noticias.json');
const TIMEOUT = 60000; // 60 segundos

async function scrapeNoticias() {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');

        // Carrega a página só até o DOM estar disponível (muito mais rápido e menos problema com recursos pendentes)
        await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });

        // Espera o seletor do card aparecer (até 20s, ajusta se quiser)
        await page.waitForSelector('.content-card-result', { timeout: 20000 });

        // Faz o scraping
        const listaNoticias = await page.evaluate(() => {
            const cards = document.querySelectorAll('.content-card-result a.card-result');
            const noticias = [];

            cards.forEach(card => {
                const titulo = card.querySelector('h3')?.textContent?.trim() || '';
                const data = card.querySelector('label')?.textContent?.trim() || '';
                const descricao = card.querySelector('.font-weight-regular')?.textContent?.trim() || '';
                let link = card.getAttribute('href');
                let imagem = '';

                // Pega imagem se tiver
                const imgElem = card.querySelector('.col-md-3 img');
                if (imgElem) {
                    imagem = imgElem.getAttribute('src') || '';
                    // Se vier relativa, cola o domínio
                    if (imagem && !imagem.startsWith('http')) {
                        imagem = 'https://www.agenciabrasilia.df.gov.br' + imagem;
                    }
                }

                // Corrige link relativo
                if (link && !link.startsWith('http')) {
                    link = 'https://www.agenciabrasilia.df.gov.br' + link;
                }

                noticias.push({
                    titulo,
                    data,
                    descricao,
                    link,
                    imagem
                });
            });

            return noticias;
        });

        // Se não encontrou nada, faz log do HTML pra debug
        if (!listaNoticias.length) {
            const html = await page.content();
            fs.writeFileSync(path.join(__dirname, '../pagina_debug.html'), html, 'utf8');
            console.error('⚠️ Nenhuma notícia encontrada! HTML salvo em pagina_debug.html para diagnóstico.');

            // Não salva JSON vazio! Dá erro e sai
            throw new Error('Nenhuma notícia encontrada na página. Abortando para evitar JSON vazio.');
        }

        // Salva o JSON normalmente
        fs.writeFileSync(OUTPUT, JSON.stringify(listaNoticias, null, 2), 'utf8');
        console.log(`✅ ${listaNoticias.length} notícias coletadas com sucesso!`);

        await browser.close();
        process.exit(0);

    } catch (err) {
        if (browser) await browser.close();
        console.error('❌ Erro durante o scraping:', err);
        process.exit(1);
    }
}

// Opcional: tenta rodar duas vezes antes de desistir (pode ser útil pra problemas transitórios)
async function runWithRetry(maxTries = 2) {
    for (let i = 1; i <= maxTries; i++) {
        try {
            console.log(`Tentativa ${i} de ${maxTries}`);
            await scrapeNoticias();
            break;
        } catch (err) {
            if (i === maxTries) {
                console.error('Falhou em todas as tentativas 😭');
                process.exit(1);
            } else {
                console.warn('Tentando novamente...');
                await new Promise(r => setTimeout(r, 4000));
            }
        }
    }
}

runWithRetry(2);
