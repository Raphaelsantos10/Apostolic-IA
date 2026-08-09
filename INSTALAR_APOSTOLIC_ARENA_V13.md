# Instalar Apostolic Arena V13

Aplicar depois da V12.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-campeoes-e-ia-v13.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Roteiro de teste

1. Selecione cada Campeao no menu e entre em **BATALHAR**.
2. Confirme que o botao da habilidade mostra o mesmo Campeao escolhido.
3. Moises: verifique vida adicional e reducao do dano recebido.
4. Davi: verifique que tropas e torres rivais param de atacar por tres segundos.
5. Sansao: verifique aumento de velocidade, frequencia e dano por quatro segundos.
6. Debora: verifique o escudo de 200 HP nas tropas azuis.
7. Confirme a recarga de 18 segundos no botao.
8. Observe a Fe rival: a IA deve aguardar energia, gastar por carta e regenerar.
9. Ataque uma rota e confirme que a IA reforca o lado ameacado.
10. Para testar morte subita rapidamente, altere temporariamente `MATCH_DURATION_SECONDS` para `15`.
11. Confirme efeito de destruicao, resultado e recompensa.
12. Confirme que pontes, cronometro e projeteis da V12 continuam funcionando.

Nao faca commit antes da inspecao visual.

Depois da aprovacao:

```bash
git add apps/web/components/apostolic-arena-battle-3d.tsx \
  apps/web/components/apostolic-arena-battle-3d.module.css \
  docs/sprints/SPRINT_APOSTOLIC_ARENA_CAMPEOES_E_IA_V13.md \
  INSTALAR_APOSTOLIC_ARENA_V13.md
git commit -m "feat(arena): adicionar habilidades e IA por deck"
git push origin feature/apostolic-arena-v2
```

