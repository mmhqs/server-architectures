## Teste de estresse
O teste que vamos criar simula um único usuário autenticado tentando deliberadamente ultrapassar o limite de 100 requisições para verificar se o sistema se comporta como esperado.

### Metodologia
Usaremos uma ferramenta chamada k6. Ela é perfeita para isso, pois nos permite escrever o cenário de teste em JavaScript, lidar com autenticação (essencial para a nossa aplicação) e verificar as respostas.

O plano do nosso teste será:
- Fase 1 (Autenticação): antes de tudo, o script fará uma única requisição a um endpoint de login para obter um token JWT válido.
- Fase 2 (Ataque): o script usará esse token para disparar um número de requisições bem acima do seu limite (ex: 200 requisições) o mais rápido possível contra uma rota protegida.
- Fase 3 (Verificação): durante o "ataque", vamos verificar cada resposta:
As primeiras 100 requisições devem retornar um status de sucesso (ex: 200 OK).
A partir da 101ª requisição, o servidor deve começar a responder com 429 Too Many Requests.

Ferramentas Necessárias
- Node.js (que você já tem).
- k6: Uma ferramenta de teste de carga.

Como executar 
1. Iniciar a API localmente em um terminal.
2. Abrir um novo terminal e executar o script k6 com o comando:
k6 run rateLimitTest.js


