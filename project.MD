Plano rápido (visão geral)

Engine: Phaser 3 (Arcade Physics).

Plataforma: Web mobile-first (touch).

Loop: Estrada rolando para cima (infinite scroll). Obstáculos descendo. Carro controlado por “pressionar e segurar em cima do carro”.

Checkpoints: 3 placas que entregam: Chave → Mapa → Ingresso.

Final: Casa (goal) → mostra o convite (data, hora, endereço) e botões úteis.

Arquivos: index.html, main.js, scenes/Boot.js, scenes/Preload.js, scenes/Game.js, scenes/UI.js, assets/…

Variáveis do convite (mantenha num lugar só)

Antes de começar, defina esses dados (a IA pode injetar em config/invite.js ou no topo do Game.js):


# Plano Rápido — Wedding Invitation Game (com TypeScript)

## Engine
- **Phaser 3** (Arcade Physics)

## Plataforma
- Web mobile-first (touch)

## Loop do Jogo
- Estrada rolando para cima (infinite scroll)
- Obstáculos descendo
- Carro controlado por “pressionar e segurar em cima do carro”

## Checkpoints
- 3 placas: Chave → Mapa → Ingresso

## Final
- Casa (goal) → mostra o convite (data, hora, endereço) e botões úteis

## Estrutura de Arquivos
- `index.html`
- `main.ts`
- `scenes/Boot.ts`
- `scenes/Preload.ts`
- `scenes/Game.ts`
- `scenes/UI.ts`
- `config/invite.ts`
- `assets/…`

## Variáveis do Convite

```js
const INVITE = {
  coupleNames: "Nome & Nome",
  date: "10/11/2025",
  time: "16:00",
  addressText: "Rua Exemplo, 123 - Bairro, Cidade/UF",
  mapsUrl: "https://maps.google.com/?q=Rua%20Exemplo%20123%20Cidade%20UF"
};
```

---

# Tarefas e Prompts

## Tarefa 0 — Projeto Base e Estrutura

**Objetivo:** Subir um boilerplate mínimo do Phaser 3.

**Critérios de Aceite:**
- Phaser instalado via NPM
- `main.ts` inicia Boot, Preload, Game, UI
- Página abre em desktop e mobile (orientação retrato)

**Prompt para IA:**
> Crie um projeto web simples com Phaser 3 e TypeScript.  
> Instale Phaser 3 via NPM (`npm install phaser`).  
> Arquivos: `index.html`, `main.ts`, `scenes/Boot.ts`, `scenes/Preload.ts`, `scenes/Game.ts`, `scenes/UI.ts`, `config/invite.ts`.  
> Importe Phaser no `main.ts` e use tipos no TypeScript.  
> `main.ts` deve configurar o game com Arcade Physics, resolução responsiva (fit e center), background preto.  
> Registre cenas: Boot → Preload → Game → UI.  
> Importe INVITE de `config/invite.ts` (ou declare global) com os campos: coupleNames, date, time, addressText, mapsUrl.  
> Garanta pointer events habilitados para mobile.  
> Inclua CSS básico para remover scroll e travar o viewport.

---

## Tarefa 1 — Boot & Preload (Assets e Fontes)

**Objetivo:** Carregar assets (placeholders) e preparar fontes.

**Critérios de Aceite:**
- Cenas trocam sem erros
- Placeholders visíveis (carro, estrada, etc.)

**Prompt para IA:**
> Na cena Preload (em TypeScript), carregue os seguintes assets (placeholders):  
> - road (tile/texture para estrada)  
> - carPlayer, carEnemy1, carEnemy2  
> - pothole  
> - checkpointSign  
> - houseGoal  
> - iconKey, iconMap, iconTicket  
> Deixe caminhos e chaves fáceis de substituir.  
> Mostre uma barra de progresso de loading.  
> Ao terminar, this.scene.start("Game").

---

## Tarefa 2 — Estrada Infinita + Câmera + Jogabilidade Base

**Objetivo:** Estrada rolando para cima; carro parado no Y (quase fixo) com mundo descendo.

**Critérios de Aceite:**
- tileSprite simulando estrada rolando
- Carro centralizado embaixo
- “Pressionar e segurar” ativa driving
- Arrastar o dedo horizontalmente em cima do carro causa steering suave

**Prompt para IA:**
> Na cena Game (em TypeScript), implemente:  
> - Um tileSprite road ocupando a tela, com tilePositionY sendo incrementado por gameSpeed.  
> - gameSpeed padrão (ex.: 4) e driveBoost quando o jogador está segurando no carro (ex.: +2).  
> - Sprite carPlayer com Arcade Physics, posição inicial centro-inferior.  
> - Input: pointerdown somente se o ponteiro iniciou sobre o carPlayer → driving = true. pointerup → driving = false.  
> - Enquanto driving = true, aumente levemente gameSpeed e faça o carPlayer.x tender ao pointer.x com LERP (ex.: car.x += (pointer.x - car.x) * 0.15), limitado pelas bordas da pista.  
> - Mantenha o carPlayer com pequena oscilação de rotação baseada na direção (efeito de virar).  
> - HUD de velocidade textual temporária no canto superior (para debug).

---

## Tarefa 3 — Obstáculos + Spawn Manager

**Objetivo:** Spawner que cria obstáculos no topo e move para baixo.

**Critérios de Aceite:**
- Obstáculos surgem fora da tela superior e descem
- Colisões causam “hit”
- Dificuldade aumenta ao longo do tempo

**Prompt para IA:**
> Crie um ObstacleManager na cena Game (em TypeScript) que:  
> - Use this.physics.add.group() para cars e potholes.  
> - A cada intervalo (ex.: 900ms reduzindo até 500ms), sorteie criar carEnemy1, carEnemy2 ou pothole.  
> - Posição X aleatória dentro da pista; velocidade de descida baseada em gameSpeed.  
> - Reuse objetos (pooling) ou destrua ao sair da tela.  
> - Colisão: this.physics.add.overlap(carPlayer, obstacles, onHit).  
> - onHit: tocar SFX (se houver), aplicar invencibilidade curta (1s) com alpha piscando e reduzir gameSpeed temporariamente (punição) sem encerrar a run.  
> - Parâmetros de dificuldade: após cada 15s, reduza o intervalo de spawn até um mínimo.

---

## Tarefa 4 — Bordas da Pista e Feedback

**Objetivo:** Limitar área jogável e dar feedback visual.

**Critérios de Aceite:**
- Carro não passa da pista
- UI mostra vidas/golpes

**Prompt para IA:**
> Adicione limites laterais invisíveis (Arcade Physics bodies) para a pista (em TypeScript).  
> Se carPlayer colidir na lateral, faça um pequeno empurrão de volta e reduza momentaneamente o gameSpeed.  
> Adicione um contador de hits no topo (texto simples) para debug.

---

## Tarefa 5 — Checkpoints e Itens

**Objetivo:** 3 eventos de checkpoint em distâncias de “progresso”.

**Critérios de Aceite:**
- Placa surge após X metros/tempo
- Overlay informa item ganho
- HUD inventário

**Prompt para IA:**
> Implemente um CheckpointManager (em TypeScript) que dispara checkpoints nos marcos:  
> - CP1 (Chave), CP2 (Mapa), CP3 (Ingresso).  
> Cada checkpoint cria um sprite checkpointSign descendo.  
> Ao colidir, pausa temporariamente o spawner e a atualização de obstáculos; mostra um overlay (na cena UI) com texto:  
> “Você encontrou uma CHAVE!” (+ ícone iconKey), depois “Você encontrou um MAPA!”, depois “Você encontrou um INGRESSO!”.  
> Atualize um estado global inventory = { key: true/false, map: true/false, ticket: true/false }.  
> Reinicie a jogabilidade ao fechar o overlay.

---

## Tarefa 6 — HUD/Inventário (UI Scene)

**Objetivo:** Exibir 3 ícones (cinza/colorido).

**Critérios de Aceite:**
- HUD fixo no topo
- Atualiza em tempo real

**Prompt para IA:**
> Na cena UI (em TypeScript), crie um HUD com três ícones: iconKey, iconMap, iconTicket.  
> Quando inventory.key (etc.) for true, exiba a versão colorida; se não houver duas versões, simule com tint.  
> A cena UI deve ouvir eventos da cena Game (ex.: events.emit("got-item", "key")) e atualizar o HUD.

---

## Tarefa 7 — Casa (Goal Final) + Tela do Convite

**Objetivo:** Após os três checkpoints, surge uma casa; ao alcançar, exibe convite.

**Critérios de Aceite:**
- Casa aparece como objetivo final
- Painel do convite com dados do INVITE

**Prompt para IA:**
> Depois de coletar key, map e ticket, programe o GoalManager (em TypeScript) para spawnar houseGoal.  
> Ao colidir, pausa a lógica, desabilita input e exibe uma tela (cena UI) com:  
> - Título: ${INVITE.coupleNames}  
> - Texto: “Você usou a chave, o mapa e o ingresso e desbloqueou o casamento!”  
> - Data: ${INVITE.date}  
> - Horário: ${INVITE.time}  
> - Endereço: ${INVITE.addressText}  
> - Botão “Abrir no Mapa” → window.open(INVITE.mapsUrl, "_blank")  
> - Botão “Compartilhar” → navigator.share(...) se suportado; fallback: copiar texto para clipboard.  
> - Adicione um botão “Jogar de novo”.

---

## Tarefa 8 — Balance, Dificuldades e Polimento

**Objetivo:** Ajustar velocidade, spawn, UI e feedback.

**Critérios de Aceite:**
- Duração média: 1,5–3 minutos
- Feedbacks visuais claros

**Prompt para IA:**
> Ajuste constantes: gameSpeedBase, gameSpeedBoost, intervalo de spawn, largura útil da pista, força de steering (em TypeScript).  
> Adicione pequenas floating texts (“Ufa!”, “Por pouco!”) quando o jogador quase colide (distância mínima).  
> Adicione SFX simples para pegar item e bater, se possível.

---

## Tarefa 9 — Responsividade e Performance Mobile

**Objetivo:** Escalar e manter FPS.

**Critérios de Aceite:**
- Funciona nos principais mobiles
- Sem stutters perceptíveis

**Prompt para IA:**
> Implemente resize handler para manter proporção (por ex. 9:16) em TypeScript.  
> Use setInteractive({ draggable: false }) apenas onde necessário.  
> Limite alocações no update (reutilize grupos e sprites).  
> Garanta que partículas e sombras sejam leves.  
> Desative debug physics em produção.

---

## Tarefa 10 — Tela Inicial e Deploy

**Objetivo:** Landing com botão “Começar” e publicação.

**Critérios de Aceite:**
- Tela inicial com título e botão
- Deploy em GitHub Pages / Vercel / Netlify

**Prompt para IA:**
> Crie uma StartScene (em TypeScript) com:  
> - Título ${INVITE.coupleNames}, subtítulo “Convite Interativo”.  
> - Botão “Começar” → this.scene.start("Game") e inicia UI.  
> - Instruções rápidas: “Segure o dedo sobre o carro para dirigir. Desvie dos obstáculos.”  
> - Adicione um script de build simples (ou só HTML estático).
Ajuste constantes: gameSpeedBase, gameSpeedBoost, intervalo de spawn, largura útil da pista, força de steering.


