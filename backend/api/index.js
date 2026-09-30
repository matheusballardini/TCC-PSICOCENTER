// Ponto de entrada do backend como função serverless do Vercel. O app Express
// de verdade mora em ../app.js (usado tanto aqui quanto pelo server.js do
// `npm run dev` local) — aqui só reaproveitamos ele, sem chamar app.listen()
// (quem cuida de "ouvir" requisições em produção é o próprio Vercel).
import app from '../app.js';

export default app;
