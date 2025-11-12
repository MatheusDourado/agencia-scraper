'use strict';

// Força IPv4 primeiro (Node >=16)
require('dns').setDefaultResultOrder('ipv4first');

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Constantes
const BASE = 'https://www.agenciabrasilia.df.gov.br';
const URL = `${BASE}/noticias`;
const OUTPUT = path.join(process.cwd(), 'noticias.json'); // estável no Actions
const MAX_ITEMS = Number(process.env.MAX_ITEMS || 20);

// Cliente HTTP com timeout maior e headers decentes
const http = axios.create({
    timeout: 60000,            // 60s
    maxRedirects: 5,
    proxy: false,              // evita proxy do ambiente
    headers: {
        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SrDouradoBot/1.0',
        'accept-language': 'pt-BR,pt;q=0.9',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    validateStatus: s => s >= 200 && s < 400
});

// Helper: espera
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Helper: absolutiza URLs
function absolutize(u) {
    if (!u) return '';
    if (u.startsWith('http')) return u;
    if (u.startsWith('//')) return `https:${u}`;
    return `${BASE}${u}`;
}

// GET com retry (2s, 4s, 8s)
async function getHtmlWithRetry(url, tries = 3) {
    let lastErr;
    for (let i = 0; i < tries; i++) {
        try {
            if (i === 0) console.log(`Buscando notícias de ${url}`);
            const { data } = await http.get(url);
            return data;
        } catch (e) {
            lastErr = e;
            const wait = 2000 * Math.pow(2, i); // 2s, 4s, 8s
            console.log(`Erro durante o scraping: ${e.code || e.message}`);
            if (i < tries - 1) {
                console.log(`Aguardando ${wait}ms antes da próxima tentativa...`);
                await sleep(wait);
            }
        }
    }
    throw lastErr;
}

async function scrapeNoticias() {
    const html = await getHtmlWithRetry(URL, 3);
    const $ = cheerio.load(html);

    const noticias = [];

    // Seletores da listagem
    $('.content-card-result a.card-result').each((index, el) => {
        try {
            const $card = $(el);
            const titulo = $card.find('h3').text().trim();
            const dataLabel = $card.find('label').text().trim(); // evita sombra de "data"
            const descricao = $card.find('.font-weight-regular').text().trim();

            let link = absolutize($card.attr('href'));
            let imagem = absolutize($card.find('.col-md-3 img').attr('src'));

            if (titulo && link) {
                noticias.push({
                    titulo,
                    data: dataLabel || null,
                    descricao: descricao || null,
                    link,
                    imagem: imagem || null
                });
            }
        } catch (err) {
            console.warn(`Erro ao processar card ${index}: ${err.message}`);
        }
    });

    if (!noticias.length) {
        throw new Error('Nenhuma notícia encontrada! Verifique os seletores CSS.');
    }

    const out = noticias.slice(0, MAX_ITEMS);
    fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
    console.log(`Sucesso: ${out.length} notícias salvas em ${OUTPUT}`);
    return out;
}

async function runWithRetry(maxTries = 3) {
    for (let i = 1; i <= maxTries; i++) {
        try {
            console.log(`\nTentativa ${i} de ${maxTries}`);
            await scrapeNoticias();
            return;
        } catch (err) {
            console.error(`Erro: ${err.code || err.message}`);
            if (i === maxTries) {
                // fallback: se já existe um JSON anterior, não derruba o pipeline
                if (fs.existsSync(OUTPUT)) {
                    console.warn('Falhou, mas mantendo noticias.json anterior.');
                    process.exitCode = 0;
                } else {
                    process.exitCode = 1;
                }
                return;
            }
            const delay = 2000 * Math.pow(2, i - 1); // 2s, 4s
            console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
            await sleep(delay);
        }
    }
}

runWithRetry(3);
 
