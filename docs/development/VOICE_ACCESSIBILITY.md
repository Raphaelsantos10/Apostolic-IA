# Voz e acessibilidade oral

## Arquitetura

Os recursos usam APIs progressivas do navegador:

- `SpeechRecognition` ou `webkitSpeechRecognition` para ditado;
- `speechSynthesis` e `SpeechSynthesisUtterance` para leitura;
- `localStorage` para consentimento, voz e velocidade.

Nenhuma API de voz é requisito para usar a aplicação.

## Fluxo de ditado

1. O utilizador ativa o consentimento local.
2. Pressiona o botão de ditado.
3. O navegador solicita ou verifica a permissão do microfone.
4. A transcrição aparece no campo textual.
5. O utilizador revê e edita o texto.
6. Somente o envio normal do formulário transmite a pergunta.

## Leitura falada

A resposta textual continua visível. Os controles permitem iniciar novamente,
pausar, continuar e parar. A velocidade e a voz são resolvidas no dispositivo.

## Quiz oral

A questão e todas as opções podem ser ouvidas. A resposta falada produz uma
transcrição editável. A aplicação aceita o número ou o texto exato da opção e
exige confirmação antes de registar a resposta.

## Privacidade e segurança

- consentimento desativado por padrão;
- ausência de gravação ou armazenamento de áudio pela aplicação;
- sem início automático do microfone;
- sem alteração dos guardrails do professor de IA;
- transcrição tratada como texto normal somente após envio;
- cancelamento da leitura ao desmontar o componente.

## Compatibilidade e fallback

Quando uma API não existe, a interface informa a indisponibilidade e mantém
campos, respostas, referências e opções em texto. Permissão recusada ou falha de
reconhecimento nunca bloqueia digitação ou seleção por botões.

## Validar

No Git Bash:

```bash
pnpm --filter @apostolic-ia/web test
pnpm typecheck
pnpm build
```
