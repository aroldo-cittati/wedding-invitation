// Game.ts - Cena principal do jogo
export class Game extends Phaser.Scene {
  private road!: Phaser.GameObjects.TileSprite;
  private carPlayer!: Phaser.Physics.Arcade.Sprite;
  private gameSpeed: number = 4;
  private baseSpeed: number = 0;
  private driveBoost: number = 6;
  private driving: boolean = false;
  private speedText!: Phaser.GameObjects.Text;
  private roadWidth: number = 280; // será recalculado em create()
  private roadCenterX: number = 180; // será recalculado em create()
  private pointerOffsetX: number = 0;
  private roadTileScale: number = 1; // escala aplicada ao tile da estrada (para casar velocidades)

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

  // Rampa de velocidade (dificuldade crescente)
  private speedRamp: number = 0; // multiplicador incremental (0 => x1.0)
  private readonly speedRampMax: number = 4.0; // até +200% (x3 no total)
  private readonly speedRampStep: number = 0.15; // incremento por etapa
  private readonly speedRampInterval: number = 3000; // ms entre incrementos
  private speedRampEvent!: Phaser.Time.TimerEvent;

  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Primeiro, adicionar um fundo de emergência para garantir que algo apareça
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x333333);

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
      this.roadTileScale = coverScale;
    } else {
      this.roadTileScale = 1;
    }

  // Criar carro do jogador (tamanho proporcional à tela)
  this.carPlayer = this.physics.add.sprite(this.roadCenterX, height - 100, 'carPlayer');
  this.carPlayer.setOrigin(0.5, 0.5);

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

    // HUD de velocidade (debug)
    this.speedText = this.add.text(10, 10, `Velocidade: ${this.gameSpeed}`, {
      font: '16px Arial',
      color: '#ffffff'
    });

    // Iniciar cena UI paralela
    this.scene.launch('UI');

  // Grupo de obstáculos e colisão (Tarefa 3)
  this.obstacles = this.physics.add.group({ allowGravity: false });
  this.physics.add.overlap(this.carPlayer, this.obstacles, this.onHit, undefined, this);

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
  }

  update() {
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
        
        // Limitar nas bordas da pista
        const roadLeft = this.roadCenterX - this.roadWidth / 2 + this.carPlayer.displayWidth / 2;
        const roadRight = this.roadCenterX + this.roadWidth / 2 - this.carPlayer.displayWidth / 2;
        this.carPlayer.x = Phaser.Math.Clamp(this.carPlayer.x, roadLeft, roadRight);
        
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

    // Fazer a estrada rolar para cima
    this.road.tilePositionY -= this.gameSpeed;

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

    // Atualizar HUD de velocidade
    this.speedText.setText(`Velocidade: ${this.gameSpeed.toFixed(1)} | Dirigindo: ${this.driving ? 'SIM' : 'NÃO'} | Rampa: x${(1 + this.speedRamp).toFixed(2)}`);
  }

  private increaseSpeedRamp() {
    this.speedRamp = Math.min(this.speedRampMax, this.speedRamp + this.speedRampStep);
  }

  // Spawner de obstáculos
  private spawnObstacle() {
  // Não spawnar se o jogador não estiver dirigindo
  if (!this.driving) return;

    const { width, height } = this.cameras.main;
    const roadLeft = this.roadCenterX - this.roadWidth / 2;
    const roadRight = this.roadCenterX + this.roadWidth / 2;
    const x = Phaser.Math.Between(Math.floor(roadLeft), Math.floor(roadRight));

    // Escolher tipo
    const roll = Math.random();
    let key: 'carEnemy1' | 'carEnemy2' | 'pothole';
    if (roll < 0.4) key = 'pothole'; // 40%
    else if (roll < 0.7) key = 'carEnemy1'; // 30%
    else key = 'carEnemy2'; // 30%

  const sprite = this.obstacles.create(x, -50, key) as Phaser.Physics.Arcade.Sprite;
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
    object1,
    object2
  ) => {
    // Garantir que o primeiro é o player e o segundo é obstáculo
    const player = object1 as Phaser.Physics.Arcade.Sprite;
    const obstacle = object2 as Phaser.Physics.Arcade.Sprite;
    if (this.invincible) return;
    this.invincible = true;
    this.hits += 1;

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
}
