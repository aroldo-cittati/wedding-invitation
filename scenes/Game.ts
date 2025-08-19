// Game.ts - Cena principal do jogo
export class Game extends Phaser.Scene {
  private road!: Phaser.GameObjects.TileSprite;
  private carPlayer!: Phaser.Physics.Arcade.Sprite;
  private gameSpeed: number = 4;
  private baseSpeed: number = 2;
  private driveBoost: number = 6;
  private driving: boolean = false;
  private speedText?: Phaser.GameObjects.Text;
  private hitsText?: Phaser.GameObjects.Text;
  private distanceText?: Phaser.GameObjects.Text;
  private gameOverOverlay?: Phaser.GameObjects.Rectangle;
  private gameOverTitle?: Phaser.GameObjects.Text;
  private gameOverTip?: Phaser.GameObjects.Text;
  private roadWidth: number = 280; // será recalculado em create()
  private roadCenterX: number = 180; // será recalculado em create()
  private pointerOffsetX: number = 0; // escala aplicada ao tile da estrada (para casar velocidades)

  // Obstacles (Tarefa 3)
  private obstacles!: Phaser.Physics.Arcade.Group;
  private spawnEvent!: Phaser.Time.TimerEvent;
  private spawnDelay: number = 900; // ms
  private readonly minSpawnDelay: number = 500; // ms
  private readonly spawnStep: number = 50; // ms por etapa de dificuldade
  private difficultyEvent!: Phaser.Time.TimerEvent;
  private invincible: boolean = false;
  private slowDownUntil: number = 0; // timestamp this.time.now
  private hits: number = 0;
  private maxLives: number = 5; // fácil configuração
  private isGameOver: boolean = false;
  private restarting: boolean = false;
  // Checkpoints & Inventário (Tarefa 5)
  private inventory = { key: false, map: false, ticket: false };
  private pausedForOverlay: boolean = false;
  private spawningDisabled: boolean = false; // após o último item, não spawna mais inimigos
  private checkpoints!: Phaser.Physics.Arcade.Group;
  
  // Sistema de distância por metros
  private distanceTraveled: number = 0; // metros percorridos
  private readonly metersPerPixel: number = 0.1; // conversão pixel para metro (ajuste conforme necessário)
  private readonly cp1Distance: number = 1000;  // metros para aparecer a chave
  private readonly cp2Distance: number = 3000;  // metros para aparecer o mapa
  private readonly cp3Distance: number = 6000;  // metros para aparecer o ticket
  private readonly goalSpawnDistance: number = 1000; // metros após coletar o último item
  private cp1Spawned: boolean = false;
  private cp2Spawned: boolean = false;
  private cp3Spawned: boolean = false;
  private lastCheckpointCollected: number = 0; // distância quando coletou o último checkpoint
  private sideWalls!: Phaser.Physics.Arcade.StaticGroup;
  // Goal (Tarefa 7)
  private goalSprite?: Phaser.Physics.Arcade.Sprite;
  private goalSpawned: boolean = false;
  private finalApproach: boolean = false;

  // Rampa de velocidade (dificuldade crescente)
  private speedRamp: number = 0; // multiplicador incremental (0 => x1.0)
  private readonly speedRampMax: number = 2.0; // até +200% (x3 no total)
  private readonly speedRampStep: number = 0.15; // incremento por etapa
  private readonly speedRampInterval: number = 3000; // ms entre incrementos
  private speedRampEvent!: Phaser.Time.TimerEvent;
  // HUD/Debug
  private showDebugHUD: boolean = false; // flag para ativar/desativar info de debug (velocidade, dirigindo, rampa, hits)

  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = this.cameras.main;

  // Reset de estado (importante em scene.restart())
  this.isGameOver = false;
  this.restarting = false;
  this.pausedForOverlay = false;
  this.spawningDisabled = false;
  this.finalApproach = false;
  this.goalSpawned = false;
  this.goalSprite = undefined;
  this.inventory = { key: false, map: false, ticket: false };
  this.invincible = false;
  this.hits = 0;
  this.slowDownUntil = 0;
  this.speedRamp = 0;
  // Reset das variáveis de distância
  this.distanceTraveled = 0;
  this.cp1Spawned = false;
  this.cp2Spawned = false;
  this.cp3Spawned = false;
  this.lastCheckpointCollected = 0;
  // Garantir que a física esteja ativa
  this.physics.world.resume();
  // Remover overlays antigos (se houver)
  if (this.gameOverOverlay) { this.gameOverOverlay.destroy(); this.gameOverOverlay = undefined; }
  if (this.gameOverTitle) { this.gameOverTitle.destroy(); this.gameOverTitle = undefined; }
  if (this.gameOverTip) { this.gameOverTip.destroy(); this.gameOverTip = undefined; }

  // Calcular centro e largura "útil" da pista dinamicamente
  this.roadCenterX = width / 2;
  this.roadWidth = Math.floor(width * 0.78); // ~11% margem em cada lado

    // Criar estrada (tileSprite) - ocupando a tela toda
    this.road = this.add.tileSprite(width / 2, height / 2, width, height, 'road');
    this.road.setOrigin(0.5, 0.5);
    this.road.setScrollFactor(0);
    
    // Ajustar a escala do tile (não do objeto) para cobrir toda a tela
    const roadTex = this.textures.get('road');
    const src = roadTex.getSourceImage() as HTMLImageElement;
    if (src && src.width && src.height) {
      const tileScaleX = width / src.width;
      const tileScaleY = height / src.height;
      // Use a maior escala para garantir cobertura completa
      const coverScale = Math.max(tileScaleX, tileScaleY);
      this.road.setTileScale(coverScale, coverScale);
    }

  // Criar carro do jogador (tamanho proporcional à tela)
  this.carPlayer = this.physics.add.sprite(this.roadCenterX, height - 100, 'carPlayer');
  this.carPlayer.setOrigin(0.5, 0.5);
  this.carPlayer.setDepth(10); // Sempre por cima dos obstáculos

  // Reduzir tamanho do carro mantendo proporção
  const targetCarHeight = Math.round(height * 0.14); // ~14% da altura da tela
  const scale = targetCarHeight / this.carPlayer.height;
  this.carPlayer.setScale(scale);

  // Ajustar corpo físico para o novo tamanho
  const body = this.carPlayer.body as Phaser.Physics.Arcade.Body;
  body.setCollideWorldBounds(false); // Vamos controlar manualmente
  body.setSize(this.carPlayer.displayWidth, this.carPlayer.displayHeight, true);

    // Configurar input do carro (touch/mouse)
    this.carPlayer.setInteractive();
    
  this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver) {
        // Game Over é agora tratado pelo overlay específico
        return;
      }
      // Verificar se o ponteiro começou sobre o carro
      const bounds = this.carPlayer.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) {
    this.driving = true;
    // Guardar offset para evitar "pulo" ao iniciar o toque
    this.pointerOffsetX = this.carPlayer.x - pointer.x;
  // Retomar spawner e rampa de dificuldade
  this.spawnEvent.paused = false;
  this.difficultyEvent.paused = false;
  this.speedRampEvent.paused = false;
      }
    });

    this.input.on('pointerup', () => {
      this.driving = false;
      this.pointerOffsetX = 0;
  // Pausar spawner e rampa de dificuldade
  this.spawnEvent.paused = true;
  this.difficultyEvent.paused = true;
  this.speedRampEvent.paused = true;
    });

    // HUD de velocidade e hits (debug)
    if (this.showDebugHUD) {
      const centerY = height / 2;
      
      this.speedText = this.add.text(10, centerY - 30, `Vel: ${this.gameSpeed} | Rampa: x1.0`, {
        font: '16px Arial',
        color: '#ffffff'
      }).setDepth(10);
      
      this.hitsText = this.add.text(10, centerY, `Hits: ${this.hits} | Dirigindo: NÃO`, {
        font: '16px Arial',
        color: '#ffffff'
      }).setDepth(10);
      
      this.distanceText = this.add.text(10, centerY + 30, `Distância: 0.0m`, {
        font: '16px Arial',
        color: '#ffffff'
      }).setDepth(10);
    }

    // Iniciar cena UI paralela (garantir que seja relançada mesmo após restart)
    if (!this.scene.isActive('UI')) {
      this.scene.launch('UI');
    }
    
    // Garantir que UI fique por cima após restart
    this.scene.bringToTop('UI');
    
  // Resetar HUD de inventário na UI e enviar vidas atuais
  this.game.events.emit('ui-reset-inventory');
  this.game.events.emit('ui-lives', { maxLives: this.maxLives, hits: this.hits });

    // Bordas da pista (paredes invisíveis)
    this.sideWalls = this.physics.add.staticGroup();
    const wallThickness = 10;
    const wallHeight = height + 200;
    const roadLeftEdge = this.roadCenterX - this.roadWidth / 2.5;
    const roadRightEdge = this.roadCenterX + this.roadWidth / 2.5;
    const wallL = this.add.rectangle(roadLeftEdge + wallThickness / 2, height / 2, wallThickness, wallHeight, 0x000000, 0);
    const wallR = this.add.rectangle(roadRightEdge - wallThickness / 2, height / 2, wallThickness, wallHeight, 0x000000, 0);
    this.physics.add.existing(wallL, true);
    this.physics.add.existing(wallR, true);
    wallL.setData('side', 'left');
    wallR.setData('side', 'right');
    this.sideWalls.add(wallL);
    this.sideWalls.add(wallR);
    this.physics.add.collider(this.carPlayer, this.sideWalls, this.onSideHit, undefined, this);

  // Grupo de obstáculos e colisão (Tarefa 3)
  this.obstacles = this.physics.add.group({ allowGravity: false });
  this.physics.add.overlap(this.carPlayer, this.obstacles, this.onHit, undefined, this);

  // Grupo de checkpoints (Tarefa 5)
  this.checkpoints = this.physics.add.group({ allowGravity: false });
  this.physics.add.overlap(this.carPlayer, this.checkpoints, this.onCheckpoint, undefined, this);

  // Spawner periódico (inicia pausado para não acumular antes do jogador começar)
  this.spawnEvent = this.time.addEvent({ delay: this.spawnDelay, callback: this.spawnObstacle, callbackScope: this, loop: true, paused: true });

  // Aumentar dificuldade a cada 15s (também pausado até dirigir)
  this.difficultyEvent = this.time.addEvent({ delay: 15000, callback: this.increaseDifficulty, callbackScope: this, loop: true, paused: true });

  // Rampa de velocidade progressiva (inicia pausada; só progride quando dirigindo)
  this.speedRampEvent = this.time.addEvent({
    delay: this.speedRampInterval,
    loop: true,
    paused: true,
    callback: () => this.increaseSpeedRamp()
  });

  // Os checkpoints agora são spawned baseado na distância percorrida (no método update)
  }

  update() {
    // Pausado por overlay (checkpoint) ou game over
    if (this.isGameOver || this.pausedForOverlay) {
      this.gameSpeed = 0;
      return;
    }
    if (this.isGameOver) {
      this.gameSpeed = 0;
      if (this.showDebugHUD && this.speedText) {
        this.speedText.setText(`Velocidade: 0.0 | Game Over`);
      }
      return;
    }
    // Atualizar velocidade baseado no estado driving + penalidade + rampa
    const penalized = this.time.now < this.slowDownUntil;
    if (this.driving) {
      const rampMul = 1 + this.speedRamp;
      this.gameSpeed = (this.baseSpeed + this.driveBoost) * rampMul * (penalized ? 0.6 : 1);
      
      // Steering suave - seguir o pointer
      if (this.input.activePointer.isDown) {
        const targetX = this.input.activePointer.x + this.pointerOffsetX;
        const lerpFactor = 0.15;
        
        // Aplicar LERP para movimento suave
        this.carPlayer.x += (targetX - this.carPlayer.x) * lerpFactor;
        
  // Limitar nas bordas da pista (com pequena folga para permitir colisão com a parede invisível)
  const roadLeftClamp = this.roadCenterX - this.roadWidth / 2 + this.carPlayer.displayWidth / 2 - 2;
  const roadRightClamp = this.roadCenterX + this.roadWidth / 2 - this.carPlayer.displayWidth / 2 + 2;
  this.carPlayer.x = Phaser.Math.Clamp(this.carPlayer.x, roadLeftClamp, roadRightClamp);
        
        // Efeito de rotação baseado na direção
        const direction = targetX - this.carPlayer.x;
        const maxRotation = 0.2; // radianos
        this.carPlayer.rotation = Phaser.Math.Clamp(direction * 0.01, -maxRotation, maxRotation);
      }
    } else {
  const rampMul = 1 + this.speedRamp;
  this.gameSpeed = this.baseSpeed * rampMul * (penalized ? 0.6 : 1);
      // Retornar rotação ao normal quando não está dirigindo
      this.carPlayer.rotation = Phaser.Math.Linear(this.carPlayer.rotation, 0, 0.1);
    }

  // Fazer a estrada rolar para cima (desliga no final)
  if (!this.finalApproach) {
    this.road.tilePositionY -= this.gameSpeed;
  }

    // Calcular distância percorrida baseada na velocidade do jogo
    if (this.gameSpeed > 0) {
      this.distanceTraveled += this.gameSpeed * this.metersPerPixel;
    }

    // Verificar spawn de checkpoints baseado na distância
    this.checkDistanceCheckpoints();

    // Mover obstáculos para baixo conforme gameSpeed
    const children = this.obstacles.getChildren() as Phaser.GameObjects.GameObject[];
    for (const obj of children) {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      // casar velocidade em pixels com o deslocamento visual da estrada (tilePositionY * tileScaleY)
      s.y += this.gameSpeed * this.road.tileScaleY;
      // remover ao sair da tela
      if (s.y - s.displayHeight / 2 > this.cameras.main.height + 20) {
        s.destroy();
      }
    }

    // Mover checkpoints para baixo também e acionar overlay quando alcança o carro (sem exigir colisão)
    const cpChildren = this.checkpoints.getChildren() as Phaser.GameObjects.GameObject[];
    for (const obj of cpChildren) {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      s.y += this.gameSpeed * this.road.tileScaleY;
      if (s.y - s.displayHeight / 2 > this.cameras.main.height + 20) {
        s.destroy();
        continue;
      }
      // Auto-trigger: quando a placa chega aproximadamente na altura do carro
      const triggered = s.getData('triggered');
      if (!triggered) {
        const thresholdY = this.carPlayer.y - this.carPlayer.displayHeight * 0.1;
        if (s.y >= thresholdY) {
          s.setData('triggered', true);
          const item = s.getData('cpItem') as 'key' | 'map' | 'ticket';
          this.triggerCheckpoint(item, s);
        }
      }
    }

    // Atualizar HUD de velocidade
    if (this.showDebugHUD) {
      if (this.speedText) {
        this.speedText.setText(`Vel: ${this.gameSpeed.toFixed(1)} | Rampa: x${(1 + this.speedRamp).toFixed(2)}`);
      }
      if (this.hitsText) {
        this.hitsText.setText(`Hits: ${this.hits} | Dirigindo: ${this.driving ? 'SIM' : 'NÃO'}`);
      }
      if (this.distanceText) {
        this.distanceText.setText(`Distância: ${this.distanceTraveled.toFixed(1)}m`);
      }
    }

    // Mover goal e verificar chegada
    if (this.goalSprite && this.goalSprite.active) {
      const h = this.cameras.main.height;
      const topStopY = h * 0.18; // topo da tela onde a casa "aparece"
      if (!this.finalApproach) {
        this.goalSprite.y += this.gameSpeed * this.road.tileScaleY;
        if (this.goalSprite.y >= topStopY) {
          // Casa chegou ao topo: fixar e iniciar abordagem final
          this.goalSprite.y = topStopY;
          this.startFinalApproach(topStopY);
        }
      }
      // Remover se sair da tela (fallback improvável)
      if (this.goalSprite.y - this.goalSprite.displayHeight / 2 > this.cameras.main.height + 40) {
        this.goalSprite.destroy();
        this.goalSprite = undefined;
      }
    }
  }

  private increaseSpeedRamp() {
    this.speedRamp = Math.min(this.speedRampMax, this.speedRamp + this.speedRampStep);
  }

  // Verificar se é hora de spawnar checkpoints baseado na distância percorrida
  private checkDistanceCheckpoints() {
    // Checkpoint 1: Chave
    if (!this.cp1Spawned && this.distanceTraveled >= this.cp1Distance) {
      this.cp1Spawned = true;
      this.spawnCheckpoint('key');
    }
    
    // Checkpoint 2: Mapa
    if (!this.cp2Spawned && this.distanceTraveled >= this.cp2Distance) {
      this.cp2Spawned = true;
      this.spawnCheckpoint('map');
    }
    
    // Checkpoint 3: Ticket
    if (!this.cp3Spawned && this.distanceTraveled >= this.cp3Distance) {
      this.cp3Spawned = true;
      this.spawnCheckpoint('ticket');
    }
    
    // Goal: se todos os itens foram coletados e já passou a distância necessária após o último
    if (this.inventory.key && this.inventory.map && this.inventory.ticket && 
        !this.goalSpawned && this.lastCheckpointCollected > 0 && 
        this.distanceTraveled >= this.lastCheckpointCollected + this.goalSpawnDistance) {
      this.spawningDisabled = true;
      if (this.spawnEvent) this.spawnEvent.paused = true;
      if (this.difficultyEvent) this.difficultyEvent.paused = true;
      this.spawnGoal();
    }
  }

  // Spawner de obstáculos
  private spawnObstacle() {
  // Não spawnar se o jogador não estiver dirigindo
  if (!this.driving) return;
  if (this.spawningDisabled) return;

   // Limite máximo na tela
    const maxOnScreen = 4; // ajuste conforme preferir
    if (this.obstacles.getLength() >= maxOnScreen) return;

    const { height } = this.cameras.main;
    const roadLeft = this.roadCenterX - this.roadWidth / 3;
    const roadRight = this.roadCenterX + this.roadWidth / 3;
  // Ainda não sabemos a largura do sprite escalado; vamos definir o X após escalar

    // Escolher tipo
    const roll = Math.random();
    let key: 'carEnemy1' | 'carEnemy2' | 'pothole';
    if (roll < 0.4) key = 'pothole'; // 40%
    else if (roll < 0.7) key = 'carEnemy1'; // 30%
    else key = 'carEnemy2'; // 30%

  const sprite = this.obstacles.create(this.roadCenterX, -50, key) as Phaser.Physics.Arcade.Sprite;
    sprite.setOrigin(0.5, 0.5);
    sprite.setImmovable(true);
    sprite.setDepth(1);
    // Escala aproximada para combinar com a pista e o carro
  if (key === 'pothole') {
      // buraco menor
      const targetH = Math.round(height * 0.06);
      sprite.setScale(targetH / sprite.height);
    } else {
      // inimigos um pouco menores que o player
      const targetH = Math.round(height * 0.12);
      sprite.setScale(targetH / sprite.height);
    }

  // Agora que o sprite está escalado, calcule limites seguros dentro da pista
  const halfW = sprite.displayWidth / 2;
  const minX = Math.floor(roadLeft + halfW);
  const maxX = Math.floor(roadRight - halfW);
  sprite.x = Phaser.Math.Between(minX, Math.max(minX, maxX));
  }

  // Spawna um checkpoint (placa) com item associado
  private spawnCheckpoint(item: 'key' | 'map' | 'ticket') {
  const { width, height } = this.cameras.main;
  const offset = 50;
  const sprite = this.checkpoints.create(width-offset, -40, 'checkpointSign') as Phaser.Physics.Arcade.Sprite;
    sprite.setOrigin(0.5, 0.5);
    const targetH = Math.round(height * 0.15);
    sprite.setScale(targetH / sprite.height);
    sprite.setData('cpItem', item);
    sprite.setData('triggered', false);
    sprite.setDepth(2);
  }

  // Dificuldade: reduzir delay até mínimo
  private increaseDifficulty() {
    if (this.spawnDelay > this.minSpawnDelay) {
      this.spawnDelay = Math.max(this.minSpawnDelay, this.spawnDelay - this.spawnStep);
      // recriar evento com novo delay
      this.spawnEvent.remove(false);
      this.spawnEvent = this.time.addEvent({ delay: this.spawnDelay, callback: this.spawnObstacle, callbackScope: this, loop: true });
    }
  }

  // Colisão com obstáculos
  private onHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _object1,
    _object2
  ) => {
    // Verificar invencibilidade sem usar as variáveis player/obstacle
    if (this.invincible) return;
    this.invincible = true;
  this.hits += 1;
  if (this.showDebugHUD && this.hitsText) this.hitsText.setText(`Hits: ${this.hits} | Dirigindo: ${this.driving ? 'SIM' : 'NÃO'}`);
  // informar UI
  this.game.events.emit('ui-lives', { maxLives: this.maxLives, hits: this.hits });

    // Checar Game Over
    if (this.hits >= this.maxLives) {
      this.triggerGameOver();
      return;
    }

    // Penalidade de velocidade por 1s
    this.slowDownUntil = this.time.now + 1000;

    // Blink no player
    this.tweens.add({
      targets: this.carPlayer,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 5
    });

    // Fim da invencibilidade após 1s
    this.time.delayedCall(1000, () => {
      this.invincible = false;
      this.carPlayer.setAlpha(1);
    });
  }

  // Coleta de checkpoint
  private onCheckpoint: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    object1,
    object2
  ) => {
    if (this.isGameOver) return;
    const cp = (object1 === this.carPlayer ? object2 : object1) as Phaser.Physics.Arcade.Sprite;
  const item = cp.getData('cpItem') as 'key' | 'map' | 'ticket';
  this.triggerCheckpoint(item, cp);
  }

  private triggerCheckpoint(item: 'key' | 'map' | 'ticket', cp?: Phaser.Physics.Arcade.Sprite) {
    if (this.isGameOver) return;
    if (cp && cp.active) cp.destroy();

    // Atualizar inventário
    if (item === 'key') this.inventory.key = true;
    if (item === 'map') this.inventory.map = true;
    if (item === 'ticket') this.inventory.ticket = true;

    // Se todos os itens foram coletados, marcar distância para spawnar goal
    if (this.inventory.key && this.inventory.map && this.inventory.ticket && !this.goalSpawned) {
      this.lastCheckpointCollected = this.distanceTraveled;
      // Desativar novos inimigos definitivamente
      this.spawningDisabled = true;
      if (this.spawnEvent) this.spawnEvent.paused = true;
      if (this.difficultyEvent) this.difficultyEvent.paused = true;
      // O goal será spawnado no checkDistanceCheckpoints quando a distância for atingida
    }

    // Pausar jogabilidade e mostrar overlay na UI
    this.pausedForOverlay = true;
    this.driving = false;
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.difficultyEvent) this.difficultyEvent.paused = true;
    if (this.speedRampEvent) this.speedRampEvent.paused = true;

    // Emitir evento global para UI (aparece mesmo sem colisão)
    this.game.events.emit('ui-checkpoint', { item });
    // Aguardar fechamento do overlay para retomar
    const resume = () => {
      this.pausedForOverlay = false;
      if (this.spawnEvent) this.spawnEvent.paused = this.spawningDisabled || !this.driving; // não retoma após último item
      if (this.difficultyEvent) this.difficultyEvent.paused = this.spawningDisabled || !this.driving;
      if (this.speedRampEvent) this.speedRampEvent.paused = !this.driving;
      this.game.events.off('ui-checkpoint-closed', resume);
    };
    this.game.events.on('ui-checkpoint-closed', resume);
  }

  // vidas HUD agora é responsabilidade da cena UI (via eventos ui-lives)

  // Spawna a casa (goal final) no topo e no centro da pista
  private spawnGoal() {
    if (this.goalSpawned) return;
    const { height } = this.cameras.main;
    this.goalSpawned = true;
    const x = this.roadCenterX;
    const y = -60;
    const sprite = this.physics.add.sprite(x, y, 'houseGoal');
    sprite.setOrigin(0.5, 0.5);
    const targetH = Math.round(height * 0.22);
    sprite.setScale(targetH / sprite.height);
    sprite.setDepth(3);
    sprite.setImmovable(true);
    this.goalSprite = sprite;
  }

  private triggerGoal() {
    if (!this.goalSprite || this.isGameOver) return;
    // Pausar jogabilidade e mostrar convite
    this.pausedForOverlay = true;
    this.driving = false;
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.difficultyEvent) this.difficultyEvent.paused = true;
    if (this.speedRampEvent) this.speedRampEvent.paused = true;

    // Emite evento para UI apresentar o convite
    this.game.events.emit('ui-invite');

    const onRestart = () => {
      this.game.events.off('ui-restart', onRestart);
      this.scene.restart();
    };
    this.game.events.on('ui-restart', onRestart);
  }

  // Inicia a sequência final: parar a estrada e levar o carro até o topo
  private startFinalApproach(goalY: number) {
    if (this.finalApproach) return;
    this.finalApproach = true;
    // Congelar spawners para uma chegada limpa
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.difficultyEvent) this.difficultyEvent.paused = true;
    if (this.speedRampEvent) this.speedRampEvent.paused = true;

    // Reduzir gradualmente a velocidade
    this.tweens.add({
      targets: this,
      gameSpeed: 0,
      duration: 500,
      ease: 'Sine.easeOut'
    });

    // Animar carro até próximo do topo
    const targetY = goalY + (this.goalSprite ? this.goalSprite.displayHeight * 0.45 : 60);
    this.tweens.add({
      targets: this.carPlayer,
      y: targetY,
      duration: 700,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Mostrar convite
        this.triggerGoal();
      }
    });
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.driving = false;
    
    // Pausar timers e física de obstáculos
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.difficultyEvent) this.difficultyEvent.paused = true;
    if (this.speedRampEvent) this.speedRampEvent.paused = true;
    this.physics.world.pause();

    // Usar bringToTop apenas temporariamente para o input do Game Over
    this.scene.bringToTop();
    
    // Overlay Game Over com depth alto para ficar acima da UI temporariamente
    const { width, height } = this.cameras.main;
    this.gameOverOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(200).setInteractive();
    this.gameOverTitle = this.add.text(width / 2, height / 2 - 10, 'GAME OVER', { font: '28px Arial', color: '#ffffff' }).setOrigin(0.5).setDepth(201);
    this.gameOverTip = this.add.text(width / 2, height / 2 + 24, 'Toque para jogar novamente', { font: '16px Arial', color: '#ffffff' }).setOrigin(0.5).setDepth(201);
    
    // Método simples para reiniciar
    this.gameOverOverlay.once('pointerdown', () => {
      if (this.restarting) return;
      this.restarting = true;
      this.scene.restart();
    });
    
    // Fallback: qualquer toque também reinicia
    this.input.once('pointerdown', () => {
      if (this.restarting) return;
      this.restarting = true;
      this.scene.restart();
    });
  }

  // Colisão com as laterais: empurrão e leve penalidade
  private onSideHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    object1,
    object2
  ) => {
    // Descobrir qual objeto é a parede
    const wallGO = (object1 === this.carPlayer ? object2 : object1) as any;
    const side = (wallGO.getData ? wallGO.getData('side') : undefined) as 'left' | 'right' | undefined;
    const push = side === 'left' ? 12 : -12;
    // penalidade curta
    this.slowDownUntil = Math.max(this.slowDownUntil, this.time.now + 300);
    // leve empurrão de volta para o centro
    this.tweens.add({ targets: this.carPlayer, x: this.carPlayer.x + push, duration: 90, ease: 'Sine.easeOut' });
    // tremor sutil para feedback
    this.cameras.main.shake(60, 0.001);
  }
}
