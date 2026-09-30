// URL base da API. Detecta automaticamente se a página está rodando local
// (localhost/127.0.0.1, como no `npm run dev`) ou já publicada em produção.
//
// IMPORTANTE: depois de publicar o backend (ex: no Vercel), troque o valor de
// PRODUCTION_API_URL abaixo pela URL real do backend publicado. É o único
// lugar que precisa mudar — todo o resto do site usa a variável API_BASE.
const PRODUCTION_API_URL = 'https://SUBSTITUA-PELA-URL-DO-SEU-BACKEND.vercel.app';

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3001'
    : PRODUCTION_API_URL;
