const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Captura o corpo bruto da requisição para salvar exatamente o payload recebido
router.post('/', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  try {
    const timestamp = new Date();
    const iso = timestamp.toISOString();
    const y = String(timestamp.getFullYear());
    const m = String(timestamp.getMonth() + 1).padStart(2, '0');
    const d = String(timestamp.getDate()).padStart(2, '0');
    const hh = String(timestamp.getHours()).padStart(2, '0');
    const mm = String(timestamp.getMinutes()).padStart(2, '0');
    const ss = String(timestamp.getSeconds()).padStart(2, '0');
    const ms = String(timestamp.getMilliseconds()).padStart(3, '0');

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    const headers = req.headers || {};
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}, null, 2));

    // Diretório de logs (permite override via env)
    const logsDir = process.env.GOTO_WEBHOOK_LOG_DIR
      ? path.resolve(process.env.GOTO_WEBHOOK_LOG_DIR)
      : path.resolve(__dirname, '..', 'logs', 'goto-webhook');

    await fs.promises.mkdir(logsDir, { recursive: true });

    const fileName = `goto_webhook_${y}${m}${d}_${hh}${mm}${ss}_${ms}.txt`;
    const filePath = path.join(logsDir, fileName);

    const contentLines = [];
    contentLines.push('=== GoTo Webhook Request ===');
    contentLines.push(`Timestamp: ${iso}`);
    contentLines.push(`Client IP: ${clientIp}`);
    contentLines.push(`Method: ${req.method}`);
    contentLines.push(`URL: ${req.originalUrl}`);
    contentLines.push('');
    contentLines.push('--- Headers ---');
    contentLines.push(JSON.stringify(headers, null, 2));
    contentLines.push('');
    contentLines.push('--- Body ---');
    contentLines.push(rawBody || '');
    contentLines.push('');

    await fs.promises.writeFile(filePath, contentLines.join('\n'), { encoding: 'utf8' });

    // Log no console para facilitar debugging/observabilidade
    console.log(`[GoTo Webhook] Payload salvo em: ${filePath}`);

    return res.status(200).json({ success: true, savedTo: fileName });
  } catch (error) {
    console.error('Erro ao salvar payload do webhook GoTo:', error);
    return res.status(500).json({ success: false, error: 'Falha ao salvar payload do webhook' });
  }
});

// Suporte a GET: salva os parâmetros (query string)
router.get('/', async (req, res) => {
  try {
    const timestamp = new Date();
    const iso = timestamp.toISOString();
    const y = String(timestamp.getFullYear());
    const m = String(timestamp.getMonth() + 1).padStart(2, '0');
    const d = String(timestamp.getDate()).padStart(2, '0');
    const hh = String(timestamp.getHours()).padStart(2, '0');
    const mm = String(timestamp.getMinutes()).padStart(2, '0');
    const ss = String(timestamp.getSeconds()).padStart(2, '0');
    const ms = String(timestamp.getMilliseconds()).padStart(3, '0');

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const headers = req.headers || {};
    const params = req.query || {};

    const logsDir = process.env.GOTO_WEBHOOK_LOG_DIR
      ? path.resolve(process.env.GOTO_WEBHOOK_LOG_DIR)
      : path.resolve(__dirname, '..', 'logs', 'goto-webhook');

    await fs.promises.mkdir(logsDir, { recursive: true });

    const fileName = `goto_webhook_GET_${y}${m}${d}_${hh}${mm}${ss}_${ms}.txt`;
    const filePath = path.join(logsDir, fileName);

    const contentLines = [];
    contentLines.push('=== GoTo Webhook Request (GET) ===');
    contentLines.push(`Timestamp: ${iso}`);
    contentLines.push(`Client IP: ${clientIp}`);
    contentLines.push(`Method: ${req.method}`);
    contentLines.push(`URL: ${req.originalUrl}`);
    contentLines.push('');
    contentLines.push('--- Headers ---');
    contentLines.push(JSON.stringify(headers, null, 2));
    contentLines.push('');
    contentLines.push('--- Parameters (req.query) ---');
    contentLines.push(JSON.stringify(params, null, 2));
    contentLines.push('');

    await fs.promises.writeFile(filePath, contentLines.join('\n'), { encoding: 'utf8' });

    console.log(`[GoTo Webhook] Parâmetros (GET) salvos em: ${filePath}`);
    return res.status(200).json({ success: true, savedTo: fileName });
  } catch (error) {
    console.error('Erro ao salvar parâmetros do webhook GoTo (GET):', error);
    return res.status(500).json({ success: false, error: 'Falha ao salvar parâmetros do webhook' });
  }
});

module.exports = router;


