const rateLimit = require('express-rate-limit');

// Limite de 100 requisições a cada 15 minutos por usuário autenticado
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos em milissegundos
  max: 100, // Limite de 100 requisições por IP/usuário
  standardHeaders: true, // Adiciona os headers de rate limit (X-RateLimit-Limit, X-RateLimit-Remaining)
  legacyHeaders: false, // Desabilita os headers antigos
  message: {
    success: false,
    message: 'Muitas requisições enviadas por este usuário, por favor, tente novamente mais tarde.'
  },
  
  // A função mais importante: define como rastrear cada usuário
  keyGenerator: (req, res) => {
    // Se o usuário estiver autenticado, usa o ID dele para o rate limiting
    if (req.user && req.user.id) {
      return req.user.id;
    }
    // Caso contrário (para rotas não autenticadas, se houver), usa o IP
    return req.ip;
  }
});

module.exports = limiter;