# Plano de testes de acessibilidade

## Em cada componente

- Semântica e elemento nativo apropriados.
- Nome, função, valor, estado e descrição.
- Teclado e foco visível.
- Contraste em todos os temas e estados.
- Texto ampliado e conteúdo traduzido.
- Movimento reduzido.
- Mensagens de erro e estado anunciadas.

## Em cada fluxo

1. Executar somente por teclado.
2. Executar com leitor de tela em combinação suportada.
3. Ampliar texto a 200%.
4. Testar reflow equivalente a 320 CSS px.
5. Aplicar espaçamento de texto aumentado.
6. Testar claro, escuro, sépia e alto contraste da plataforma.
7. Testar toque, orientação e redução de movimento.
8. Verificar erros, carregamento, vazio, offline e sessão expirada.
9. Executar análise automática.
10. Registrar evidência, ambiente, resultado e defeitos.

## Matriz mínima futura

| Plataforma | Navegação/tecnologia assistiva |
| --- | --- |
| Windows web | Teclado, navegador moderno e leitor de tela suportado |
| macOS web | Teclado, navegador moderno e leitor de tela do sistema |
| iOS/iPadOS | Leitor de tela, zoom, texto maior e controle por voz |
| Android | Leitor de tela, ampliação, tamanho de fonte e acesso por interruptor |
| PWA | Instalação, offline e atualização com as verificações web aplicáveis |

As combinações e versões exatas serão fixadas antes da implementação e revistas
periodicamente.

## Automação

Análise estática e testes no navegador devem detectar parte dos problemas de
semântica, nomes e contraste. Aprovação automática significa apenas que nenhuma
falha coberta foi detectada; não comprova conformidade integral.

## Testes com pessoas

Antes do lançamento, incluir pessoas com diferentes formas de visão, audição,
mobilidade, cognição e uso de tecnologias assistivas. Consentimento,
remuneração, privacidade e segurança devem ser tratados com respeito.

## Evidência

Cada execução registra versão, URL ou tela, plataforma, tecnologia assistiva,
passos, resultado, critério relacionado, captura ou log quando apropriado,
responsável e data.
