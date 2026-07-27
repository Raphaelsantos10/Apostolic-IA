# Experiência bíblica

## Recursos

- áudio do capítulo por síntese de voz do dispositivo;
- armazenamento local de capítulos quando a licença permite offline;
- destaques privados e sincronizados por conta;
- notas de contexto publicadas com fonte;
- linha do tempo editorial;
- mapa contextual esquemático e acessível.

## Licenciamento

Áudio e offline são habilitados separadamente pelos campos `allows_audio` e
`allows_offline` da licença. A Versão Demonstrativa Autoral permite ambos porque
o projeto é titular do texto fictício. Essa permissão não se transfere para
traduções futuras.

A síntese de voz utiliza o recurso nativo do navegador e não cria nem distribui
um arquivo de áudio. O capítulo offline fica somente no dispositivo do
utilizador e pode ser removido pela mesma interface.

## Privacidade

Os destaques são armazenados em `verse_highlights`, protegidos por RLS e
visíveis somente ao titular. Conteúdo editorial de contexto, cronologia e mapa
é público apenas quando seu estado é `published`.

## Mapas e cronologia

Os pontos do seed são fictícios e declarados como demonstração. Dados reais
devem registrar fonte, precisão e licença conforme `docs/visual/MAPS_POLICY.md`.
Datas aproximadas devem ser apresentadas como aproximações, nunca como certeza.

## Acessibilidade

- comandos de áudio e offline são botões nativos;
- estado do destaque usa `aria-pressed`;
- mensagens de resultado usam região de status;
- o mapa possui descrição textual e pontos navegáveis por teclado;
- a experiência adapta-se a telemóvel, tablet e desktop.
