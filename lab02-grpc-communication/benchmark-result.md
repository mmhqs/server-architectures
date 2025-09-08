## Benchmark REST vs. gRPC
Para realizar uma análise comparativa do uso REST vs. gRPC, considerando a latência e throughput entre as duas abordagens, foi utilizado o script `benchmark.js` com ambos os servidores rodando.

O teste foi realizado no dia 07/09/2025 e apresenta o resultado abaixo.

### Resultado do script
🚀 Iniciando benchmark com 50 iterações por protocolo
⏱️ Este processo pode levar alguns minutos...   

🔍 Verificando disponibilidade dos servidores...
✅ Cliente gRPC inicializado
✅ Servidor gRPC disponível
✅ Servidor REST disponível

🔬 Iniciando benchmark gRPC (50 iterações)... 
✅ Cliente gRPC inicializado
🔧 Configurando usuário para benchmark gRPC...
✅ Usuário registrado com sucesso
✅ Token gRPC validado
📋 Criando tarefas de teste...
📊 Executando testes de performance gRPC...
gRPC: 20/50 completed (21 success)
gRPC: 40/50 completed (41 success)
✅ Benchmark gRPC concluído: 50/50 sucessos    
🌐 Iniciando benchmark REST (50 iterações)... 
🔧 Configurando usuário para benchmark REST...
✅ Usuário REST registrado
✅ Login REST realizado com sucesso
📋 Criando tarefas de teste REST...
📊 Executando testes de performance REST...
REST: 20/50 completed (21 success)
REST: 40/50 completed (41 success)
✅ Benchmark REST concluído: 50/50 sucessos


📊 RESULTADOS DO BENCHMARK DE PERFORMANCE

🔧 gRPC/Protocol Buffers:
   ├─ Requisições válidas: 50
   ├─ Erros: 0
   ├─ Taxa de sucesso: 100.0%
   ├─ Tempo médio: 4.37ms
   ├─ Mediana: 4.01ms
   ├─ Desvio padrão: 1.36ms
   ├─ Min/Max: 2.55ms / 8.34ms
   ├─ P95: 7.16ms
   ├─ P99: 8.34ms
   └─ Total bytes: 45.900

🌐 REST/JSON:
   ├─ Requisições válidas: 50
   ├─ Erros: 0
   ├─ Taxa de sucesso: 100.0%
   ├─ Tempo médio: 4.72ms
   ├─ Mediana: 4.28ms
   ├─ Desvio padrão: 1.88ms
   ├─ Min/Max: 3.25ms / 15.58ms
   ├─ P95: 7.28ms
   ├─ P99: 15.58ms
   └─ Total bytes: 50.318

🏆 ANÁLISE COMPARATIVA:
   ├─ Latência: gRPC é 7.5% mais rápido que REST
   ├─ Diferença média: 0.36ms
   ├─ Bandwidth: gRPC usa 8.8% menos dados
   ├─ Throughput gRPC: 229.0 req/s
   ├─ Throughput REST: 211.7 req/s
   └─ 🎯 gRPC demonstra melhor performance para este caso de uso

📝 OBSERVAÇÕES:
   • Resultados podem variar baseado em hardware, rede e carga do sistema
   • gRPC típicamente performa melhor com payloads maiores e alta frequência
   • REST pode ser mais rápido para operações simples e cache HTTP
   • Considere também fatores como debugging, tooling e ecosystem
   • Para comparação completa, certifique-se que ambos servidores estão rodando


### Discussão do resultado
O benchmark, realizado com 50 iterações para cada protocolo, demonstrou a superioridade do gRPC em relação ao REST neste cenário específico de uso, validando as vantagens geralmente atribuídas a ele em termos de performance.

#### Latência e throughput
O gRPC apresentou um tempo médio de requisição de 4,37ms, sendo 7,5% mais rápido que o tempo médio do REST, que foi de 4,72ms. Essa diferença de 0,36ms, embora pequena em uma única transação, é significativa em aplicações de alta frequência de comunicação.

O throughput do gRPC foi de 229,0 req/s, superando o do REST que alcançou 211,7 req/s. Isso indica que, para a mesma carga de trabalho, o gRPC é capaz de processar mais requisições por segundo.

#### Uso de largura de banda 
A otimização de dados do gRPC, utilizando Protocol Buffers, é evidente nos resultados. O gRPC utilizou um total de 45.900 bytes, enquanto o REST consumiu 50.318 bytes. Isso significa que o gRPC utilizou 8,8% menos dados, o que é um fator crucial em ambientes com largura de banda limitada ou em serviços que manipulam grandes volumes de dados.

#### Consistência e variação
Ambos os protocolos obtiveram uma taxa de sucesso de 100% com 50 requisições válidas e zero erros.

Embora a diferença entre a mediana do gRPC (4,01ms) e do REST (4,28ms) seja pequena, o desvio padrão do gRPC (1,36ms) é menor que o do REST (1,88ms). Isso sugere que os tempos de resposta do gRPC foram mais consistentes e menos voláteis.

Os percentis P95 e P99 também corroboram essa consistência. O P99 do REST é de 15,58ms, um valor significativamente mais alto que o tempo de resposta máximo do gRPC (8,34ms), indicando que o REST teve picos de latência mais elevados.

### Conclusão
A análise comparativa demonstra que o gRPC oferece melhor performance em latência, throughput e uso de largura de banda para este caso de uso. A eficiência dos Protocol Buffers e o design de comunicação do gRPC contribuem para esses resultados.

É importante considerar que esses resultados podem variar. A escolha ideal entre gRPC e REST também deve levar em conta outros fatores como a simplicidade de implementação, o ecossistema de ferramentas, a facilidade de debug e a compatibilidade com navegadores, onde o REST ainda é mais dominante. Para operações mais simples, que se beneficiam do cache HTTP e da simplicidade do JSON, o REST pode ser a escolha preferida. No entanto, para microsserviços internos que exigem alta performance e eficiência de rede, o gRPC se mostra uma solução superior.