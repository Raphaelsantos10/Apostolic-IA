# Sprint Apostolic Arena - Fundacao 3D V15.1

## Infraestrutura

- registro central liga card ID, arquivo GLB, escala, rotacao e animacoes;
- entradas preparadas para Moises 117, Davi 119, Sansao 121 e Debora 125;
- carregamento GLB sob demanda;
- cache reutiliza o mesmo arquivo entre varias invocacoes;
- clonagem cria instancias independentes no campo;
- coordenadas 18 por 32 convertem a posicao da simulacao para o mundo Babylon;
- orientacao considera equipa azul ou vermelha;
- sincronizacao acompanha movimento e remocao das unidades;
- estados disponiveis: espera, caminhada, ataque, habilidade, impacto e derrota;
- aliases aceitam nomes comuns de animacoes do Blender e Mixamo;
- falha de rede, GLB ou esqueleto mantem o retrato 2D;
- qualidade baixa desativa modelos 3D e preserva desempenho;
- descarte limpa modelos, animacoes e referencias ao sair da batalha.

## Protecao visual

Os quatro modelos permanecem desativados ate validacao individual. A V15.1 nao usa conversao automatica das imagens existentes e nao substitui um retrato por um GLB incompleto.

## Proxima etapa

V15.2 adiciona Moises completo, testa as seis animacoes, calibra escala e posicao nas duas pontes e somente entao ativa `enabled: true` para a carta 117.

