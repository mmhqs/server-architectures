const cache = {};
const DEFAULT_TTL_SECONDS = 60;

function getCacheKey(req) {
  // Cria uma chave única para a requisição, combinando a URL e os parâmetros da query.
  return `${req.path}?${JSON.stringify(req.query)}`;
}

function get(req) {
  const key = getCacheKey(req);
  const cachedItem = cache[key];

  // Verifica se o item existe e se ainda é válido (não expirou)
  if (cachedItem && Date.now() < cachedItem.expiry) {
    console.log(`Cache hit para a chave: ${key}`);
    return cachedItem.data;
  }
  
  console.log(`Cache miss para a chave: ${key}`);
  return null;
}

function set(req, data, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const key = getCacheKey(req);
  const expiry = Date.now() + ttlSeconds * 1000;
  cache[key] = { data, expiry };
  console.log(`Cache set para a chave: ${key}`);
}

function invalidateAll() {
  for (const key in cache) {
    if (key.startsWith('/tasks')) { // Invalida apenas o cache das rotas de tasks
      delete cache[key];
    }
  }
  console.log('Cache de tarefas invalidado.');
}

module.exports = {
  get,
  set,
  invalidateAll
};