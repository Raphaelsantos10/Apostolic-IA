# Validação da Sprint 031

## Estado

Aprovada para merge no PR 43.

## Primeiro incremento

- [x] testes de resiliência web aprovados;
- [x] testes do manifesto de backup aprovados;
- [x] typecheck aprovado;
- [x] build aprovado;
- [x] endpoint `/api/health` inspecionado;
- [x] checks do Draft PR aprovados.

## Evidência do primeiro incremento

- cinco checks do PR 43 aprovados;
- `/api/health` respondeu `200` com `no-store` e `x-request-id`;
- resposta pública limitada a `status`, `service` e `timestamp`;
- manifesto de teste validado e alteração posterior detectada.

## Segundo incremento

- [x] testes do auditor de qualidade aprovados;
- [x] páginas críticas sem violações cobertas;
- [x] tempos medianos dentro do orçamento de 800 ms;
- [x] inspeção manual de teclado e foco;
- [x] zoom de 200% e reflow a 320 CSS px;
- [x] leitor de tela em fluxo representativo;
- [x] checks do PR aprovados novamente.

## Evidência de desempenho e acessibilidade

O auditor local terminou com `passed: true` em todas as rotas cobertas:

| Rota | Mediana observada | Orçamento |
| --- | ---: | ---: |
| `/` | 18,6 ms | 800 ms |
| `/entrar` | 73,2 ms | 800 ms |
| `/criar-conta` | 26,4 ms | 800 ms |
| `/dashboard-preview` | 21,1 ms | 800 ms |
| `/offline` | 21,5 ms | 800 ms |

A inspeção manual aprovou navegação por teclado, foco visível, zoom a 200%,
reflow a 320 CSS px e um fluxo representativo com o Narrador do Windows.

## Evidência de backup e restauração

- dump local privado com 583 KiB;
- manifesto SHA-256 verificado antes da restauração;
- restauração executada numa base temporária, nunca em produção;
- 54 de 54 tabelas públicas recuperadas;
- RLS preservada em 54 de 54 tabelas públicas;
- 1 de 1 utilizador local recuperado;
- tempo observado de restauração: 10 segundos;
- base e ficheiros temporários removidos após a validação.

A primeira tentativa com o papel local `postgres` parou ao recriar uma função
interna do Realtime que configura `log_min_messages`. O exercício foi reiniciado
num destino vazio com `supabase_admin`, após confirmar `rolsuper` e
`rolcanlogin`, e terminou sem divergências. Essa conta administrativa é apenas
para manutenção no ambiente local isolado; produção deve usar o processo
autorizado do fornecedor.

## Limitações

A validação demonstra recuperação do snapshot local e acessibilidade nos fluxos
representativos inspecionados. Ela não constitui certificação integral de
conformidade WCAG 2.2 AA, SLA comercial de RPO/RTO ou teste de carga de
produção. Antes do lançamento permanecem necessários testes com pessoas com
deficiência, dispositivos representativos e o piloto controlado.
