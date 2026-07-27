# Sprint 025 - Voz e acessibilidade oral

## Estado

Concluída após validação e incorporação do PR nº 27.

## Objetivo

Oferecer entrada e saída por voz como melhoria progressiva, preservando a
experiência textual completa, a autonomia do utilizador e a privacidade.

## Escopo

- entrada de perguntas por voz;
- transcrição visível e editável antes do envio;
- leitura falada de respostas fundamentadas;
- controles para iniciar, pausar, continuar e parar;
- leitura e resposta oral em quizzes;
- preferências locais de voz e velocidade;
- consentimento explícito antes de ativar o microfone;
- mensagens acessíveis de estado e erro;
- fallback textual completo;
- compatibilidade progressiva com Web Speech API;
- testes unitários, typecheck, build e inspeção visual.

## Decisões

- A aplicação não inicia o microfone automaticamente.
- O áudio capturado não é guardado pela aplicação.
- Somente a transcrição revista e enviada segue o fluxo normal da pergunta.
- Preferências de voz ficam no dispositivo e não exigem migração de dados.
- Navegadores sem reconhecimento ou síntese de fala mantêm todos os fluxos em
  texto e botões.
- Recursos de voz não substituem citações, guardrails ou autenticação.

## Critérios de aceite

- [x] O ditado exige consentimento explícito.
- [x] A pergunta transcrita permanece editável antes do envio.
- [x] Respostas podem ser ouvidas, pausadas, retomadas e interrompidas.
- [x] Quizzes apresentam leitura da pergunta e resposta oral confirmável.
- [x] Voz e velocidade podem ser escolhidas no dispositivo.
- [x] Falhas ou ausência da API não bloqueiam o fluxo textual.
- [x] Estados de voz são anunciados por regiões acessíveis.
- [x] Testes unitários aprovados.
- [x] Typecheck aprovado.
- [x] Build aprovado.
- [x] Inspeção visual em telemóvel e desktop aprovada.
- [x] Checks do Pull Request aprovados.
- [x] Pull Request aprovado e incorporado à `main`.

## Privacidade

O consentimento fica desativado por padrão. O navegador controla a permissão
física do microfone. A aplicação processa os resultados expostos pela API do
navegador e não cria ficheiros de áudio nem os envia ao backend.

## Limitações

Reconhecimento e síntese dependem do navegador, sistema operativo, idioma e
vozes instaladas. A Web Speech API não possui suporte uniforme; por isso o texto
é sempre a interface canónica.

O teste manual de transcrição real ficou bloqueado pelo defeito no microfone do
notebook usado na inspeção. A gravação comprovou o consentimento, os estados de
captura, a falha segura e o fallback textual. O fluxo positivo permanece coberto
pela implementação progressiva e deve ser repetido futuramente com microfone
funcional, sem bloquear utilizadores sem voz.

## Rollback

Reverter os commits da Sprint 025 remove os componentes e testes de voz sem
alterar dados existentes, pois não há migração de banco nesta entrega.

## Próximo passo

Iniciar a Sprint 026 - Sustentabilidade: custos, quotas, compras e assinaturas.
