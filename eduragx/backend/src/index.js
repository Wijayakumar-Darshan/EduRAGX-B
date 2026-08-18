require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes         = require('./routes/auth.routes');
const adminRoutes        = require('./routes/admin.routes');
const teacherRoutes      = require('./routes/teacher.routes');
const studentRoutes      = require('./routes/student.routes');
const parentRoutes       = require('./routes/parent.routes');
const aiRoutes           = require('./routes/ai.routes');
const notificationRoutes = require('./routes/notification.routes');
const blockchainRoutes   = require('./routes/blockchain.routes');
const { socketHandler }  = require('./services/socket.service');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET','POST'], credentials: true },
});
app.set('io', io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth',          authRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/teacher',       teacherRoutes);
app.use('/api/student',       studentRoutes);
app.use('/api/parent',        parentRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blockchain',    blockchainRoutes);

app.get('/api/health', (_req, res) => res.json({
  status: 'ok', timestamp: new Date().toISOString(),
  ragService: process.env.RAG_SERVICE_URL || 'http://localhost:8000',
}));
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => { console.error(err.stack); res.status(err.status||500).json({ error: err.message }); });

socketHandler(io);

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error(
    '❌ JWT_SECRET is missing. Authentication will not work.'
  );
}

server.listen(PORT, () => {
  console.log(
    `\n🚀 EduRAGX Backend  → http://localhost:${PORT}`
  );

  console.log(
    `🤖 RAG Service URL  → ${
      process.env.RAG_SERVICE_URL ||
      'http://localhost:8000'
    }`
  );

  console.log(
    `⛓  Blockchain mode  → ${
      !process.env.BLOCKCHAIN_CONTRACT_ADDRESS
        ? 'MOCK (set env vars for Sepolia)'
        : 'Ethereum Sepolia'
    }`
  );

  console.log(
    `🌍 Environment      → ${
      process.env.NODE_ENV ||
      'development'
    }\n`
  );
});
