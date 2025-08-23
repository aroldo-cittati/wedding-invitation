## Instruções rápidas para agentes de código (projeto: wedding-invitation)

Objetivo: deixar um agente imediatamente produtivo ao modificar/estender este jogo Phaser 3 (TypeScript + Vite).

Principais pontos — visão geral
- Engine: Phaser 3 (Arcade Physics). Entrada principal em `main.ts` que registra as cenas: Boot, Preload, Game, UI.
- Arquitetura: cena `Game` contém a lógica do jogo (mundo, colisões, spawner), cena `UI` contém HUD e overlays; componentes visuais e gerenciadores ficam em `components/ui/`.
- Configuração de conteúdo (convite): `config/invite.ts` é a única fonte canônica para os dados do convite (coupleNames, date, time, addressText, inviteUrl).


A comunicação sempre deve ser em português.
Os comentarios do codigo sempre em português.
Não crie arquivos de exemplo.
