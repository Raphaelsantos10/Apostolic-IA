# Sprint Apostolic Arena - Fidelidade Visual V8.1

## Direcao aprovada

- arena vertical de 18 x 32 tiles;
- jogador azul na metade inferior;
- inimigo vermelho na metade superior;
- rio horizontal central com dois tiles;
- duas pontes laterais;
- duas torres laterais 3 x 3 por equipe;
- templo principal 4 x 4, central e recuado;
- tema biblico de cidade fortificada em pedra;
- montanhas, palmeiras, muralhas, portoes, braseiros e cristais;
- campo vazio preparado para deploy;
- HUD sobreposto sem ocupar o centro da batalha.

## Implementacao

O cenário cinematografico e renderizado como camada visual no Babylon.js. O grid, rio, pontes e seis torres procedurais da V8 continuam presentes como geometria logica invisivel, preparando selecao de tiles e colisao para a V9.

## Movimento

A V8.1 inclui movimento suave de camera. Água, bandeiras, fogo e vegetacao receberao animacoes independentes quando os elementos forem convertidos em camadas ou modelos 3D nas proximas iteracoes.

## Validacao

Confirmar orientacao azul embaixo/vermelho no topo, seis torres, duas pontes, rio central, quatro cartas no canto inferior esquerdo, proxima carta no canto inferior direito e fallback Phaser.
