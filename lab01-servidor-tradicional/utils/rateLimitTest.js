import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// --- CONFIGURAÇÃO DO TESTE ---
const BASE_URL = 'http://localhost:3000'; // A URL base da sua API
const LOGIN_ENDPOINT = '/auth/login'; // O endpoint de login
const PROTECTED_ENDPOINT = '/tasks';  // Um endpoint protegido pelo rate limit
const USER_EMAIL = 'user@test.com'; // Email de um usuário de teste
const USER_PASSWORD = '123456'; // Senha do usuário de teste

// --- MÉTRICAS CUSTOMIZADAS ---
// Um contador para sabermos exatamente quantas requisições foram bloqueadas
const blockedRequests = new Counter('blocked_requests');

// --- OPÇÕES DO k6 ---
export const options = {
  scenarios: {
    stressTest: {
      executor: 'per-vu-iterations', // Cada "usuário virtual" (VU) fará um número fixo de iterações
      vus: 1, // Vamos simular apenas 1 usuário
      iterations: 200, // Disparando 200 requisições, bem acima do limite de 100
      maxDuration: '2m', // Duração máxima do teste
    },
  },
  // Define os limiares de falha do teste. Se não forem atendidos, o k6 sai com erro.
  thresholds: {
    'blocked_requests': ['count >= 99'], // Esperamos que pelo menos 99 requisições sejam bloqueadas (idealmente 100)
    'http_req_failed': ['rate<0.01'], // Menos de 1% das requisições podem falhar (falhar aqui significa erro de rede, não um status 429)
  },
};

// --- FASE 1: AUTENTICAÇÃO (executado apenas uma vez) ---
export function setup() {
  console.log('Autenticando para obter o token JWT...');
  const loginPayload = JSON.stringify({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(`${BASE_URL}${LOGIN_ENDPOINT}`, loginPayload, params);
  
  // Verificamos se o login foi bem-sucedido
  check(res, { 'login successful': (r) => r.status === 200 });

  const authToken = res.json('token'); // Ajuste 'token' para o nome do campo do token na sua resposta de login
  if (!authToken) {
      throw new Error('Não foi possível obter o token de autenticação. Verifique suas credenciais e a resposta do login.');
  }
  console.log('Token obtido com sucesso.');
  return { token: authToken }; // O token é passado para a função principal
}

// --- FASE 2 e 3: ATAQUE E VERIFICAÇÃO (executado 200 vezes) ---
export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`, // Usa o token obtido no setup
      'Content-Type': 'application/json',
    },
  };

  // Dispara a requisição para a rota protegida
  const res = http.get(`${BASE_URL}${PROTECTED_ENDPOINT}`, params);

  // Verificamos a resposta
  const isBlocked = check(res, {
    'request was blocked (429)': (r) => r.status === 429,
  });

  // Se a requisição foi bloqueada, incrementamos nosso contador
  if (isBlocked) {
    blockedRequests.inc(1);
  }

  // Verificamos também se a requisição foi bem-sucedida (status 2xx)
  check(res, {
    'request was successful (2xx)': (r) => r.status >= 200 && r.status < 300,
  });
}