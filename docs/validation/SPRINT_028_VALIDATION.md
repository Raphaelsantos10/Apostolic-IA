# Validação da Sprint 028

## Estado

Validação concluída para a base Android e PWA. A execução física em iOS
permanece pendente até existir dispositivo Apple, macOS ou build remoto.

## Evidências

- [x] Configuração Android e iOS adicionada.
- [x] Idiomas e fusos modelados.
- [x] Cache público restringido.
- [x] Dispositivos e fila offline protegidos por RLS.
- [x] Teste pgTAP adicionado.
- [x] `supabase db reset`.
- [x] `supabase test db`: 16 arquivos e 137 testes aprovados.
- [x] `pnpm typecheck`.
- [x] `pnpm build`.
- [x] Inspeção PWA, autenticação, offline e Android físico.
- [x] Checks do GitHub: três aprovados e nenhuma falha.
- [ ] Inspeção em dispositivo iOS ou build remoto.

## Resultado

O Expo Go alcançou o projeto pela rede local após configurar o perfil privado
do Windows e atualizar o cliente para o SDK 57. O aplicativo abriu no Android.
A pendência iOS não autoriza publicação na App Store antes da validação física.
