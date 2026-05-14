'use strict';

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../swagger/swagger.json');

const app = express();

// ── 미들웨어 ──────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ── 요청/응답 로거 ────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[HTTP] [${level}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ── Swagger UI ───────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── 라우터 마운트 ──────────────────────────────────
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/users',      require('./routes/user.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/todos',      require('./routes/todo.routes'));

// ── 404 핸들러 ────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'RESOURCE_NOT_FOUND', message: '요청한 경로를 찾을 수 없습니다.' },
  });
});

// ── 에러 핸들러 ──────────────────────────────────────
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
