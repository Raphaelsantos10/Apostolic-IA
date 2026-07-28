# Auditoria WCAG 2.2 AA da Sprint 031

## Escopo

- página inicial;
- login e criação de conta;
- dashboard aprovado;
- modo offline;
- uma aula com texto, áudio e quiz;
- leitor bíblico;
- perfil e preferências.

## Auditoria automatizada

Com o build local em execução:

```bash
node scripts/web-quality-audit.mjs http://localhost:3000
```

O relatório precisa apresentar `passed: true` em todas as rotas. A ferramenta
mede três respostas e usa a mediana para reduzir o efeito da primeira carga.

## Auditoria manual

Para cada fluxo representativo:

1. navegar somente com `Tab`, `Shift+Tab`, `Enter`, `Espaço` e setas;
2. confirmar foco sempre visível e ordem coerente;
3. ampliar o navegador a 200%;
4. testar largura equivalente a 320 CSS px sem rolagem horizontal de conteúdo;
5. ativar redução de movimento;
6. testar temas claro, escuro, sépia e alto contraste;
7. usar leitor de tela para títulos, regiões, campos, erros e progresso;
8. confirmar transcrição para áudio e alternativa textual para informação visual.

## Critérios de bloqueio

- ação inacessível por teclado;
- foco invisível, perdido ou preso;
- campo, botão, imagem informativa ou ligação sem nome;
- erro não anunciado;
- conteúdo cortado a 200% ou 320 CSS px;
- animação essencial sem alternativa;
- contraste insuficiente confirmado;
- áudio sem transcrição ou vídeo sem legendas aplicáveis.

## Declaração honesta

A aprovação do script não comprova conformidade WCAG 2.2 AA. A conformidade
exige revisão manual, tecnologias assistivas e, antes do lançamento, testes com
pessoas com deficiência em condições respeitosas.
