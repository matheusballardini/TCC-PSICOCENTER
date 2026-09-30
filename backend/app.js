import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import psychologistRoutes from './routes/psychologistRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { successResponse, errorResponse } from './utils/response.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Limitador de requisições (express-rate-limit) removido pra não atrapalhar
// apresentações/testes em localhost. Antes de colocar o backend no ar em um
// servidor público de verdade, reative algo assim (protege contra abuso e
// tentativa de força bruta no login):
//
// import rateLimit from 'express-rate-limit';
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
// app.use(limiter);

app.get('/health', (_req, res) => {
  res.json(successResponse('API online', { status: 'ok' }));
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);

// nenhuma rota bateu até aqui: devolve um 404 no mesmo formato padrão da API,
// em vez do HTML genérico de erro que o Express mostraria por padrão
app.use((req, res) => {
  res.status(404).json(errorResponse(`Rota não encontrada: ${req.method} ${req.originalUrl}`, {}, 404));
});

app.use(errorHandler);

export default app;
