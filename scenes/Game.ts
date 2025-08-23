// Game.ts - Cena principal do jogo (refatorada)
import { AudioManager } from '../src/systems/AudioManager';
import { CollisionManager } from '../src/systems/CollisionManager';
import { DEFAULT_CONFIG } from '../src/systems/GameConfig';
import { GameOverManager } from '../src/systems/GameOverManager';
import { GameplayManager } from '../src/systems/GameplayManager';
import { GameState } from '../src/systems/GameState';
import { HUDManager } from '../src/systems/HUDManager';
import { SpawnManager } from '../src/systems/SpawnManager';

export class Game extends Phaser.Scene {
  // Sistemas de gerenciamento
  private config = { ...DEFAULT_CONFIG };
  private state = new GameState();
  private spawnManager!: SpawnManager;
  private gameplayManager!: GameplayManager;
  private collisionManager!: CollisionManager;
  private hudManager!: HUDManager;
  private audioManager!: AudioManager;
  private gameOverManager!: GameOverManager;

  // Componentes principais do jogo
  private road!: Phaser.GameObjects.TileSprite;
  private carPlayer!: Phaser.Physics.Arcade.Sprite;
  private sideWalls!: Phaser.Physics.Arcade.StaticGroup;
  
  // Grupos de objetos
  private obstacles!: Phaser.Physics.Arcade.Group;
  private checkpoints!: Phaser.Physics.Arcade.Group;
  
  // Cache de dimensões
  private roadWidth: number = 280;
  private roadCenterX: number = 180;

  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Reset do estado
    this.resetGameState();
    
    // Calcular dimensões da pista
    this.calculateRoadDimensions(width);
    
    // Inicializar sistemas
    this.initializeSystems();
    
    // Criar elementos do jogo
    this.createRoad(width, height);
    this.createPlayer(height);
    this.createWalls(height);
    this.createGroups();
    this.setupCollisions();
    this.setupInput();
    this.setupUI();
    
    // Inicializar sistemas com referências
    this.initializeSystemReferences();
  }

  private resetGameState(): void {
    this.state.reset();
    // Garantir que a física esteja ativa
    this.physics.world.resume();
  }

  private calculateRoadDimensions(width: number): void {
    this.roadCenterX = width / 2;
    this.roadWidth = Math.floor(width * this.config.roadWidthPercent);
  }

  private initializeSystems(): void {
    this.spawnManager = new SpawnManager(this, this.config, this.state);
    this.gameplayManager = new GameplayManager(this, this.config, this.state, this.spawnManager);
    this.collisionManager = new CollisionManager(this, this.config, this.state);
    this.hudManager = new HUDManager(this, this.config, this.state);
    this.audioManager = new AudioManager(this, this.config, this.state);
    this.gameOverManager = new GameOverManager(this, this.state, this.audioManager);
  }
  private createRoad(width: number, height: number): void {
    // Criar estrada (tileSprite) - ocupando a tela toda
    this.road = this.add.tileSprite(width / 2, height / 2, width, height, 'road');
    this.road.setOrigin(0.5, 0.5);
    this.road.setScrollFactor(0);
    
    // Ajustar a escala do tile para cobrir toda a tela
    const roadTex = this.textures.get('road');
    const src = roadTex.getSourceImage() as HTMLImageElement;
    if (src && src.width && src.height) {
      const tileScaleX = width / src.width;
      const tileScaleY = height / src.height;
      const coverScale = Math.max(tileScaleX, tileScaleY);
      this.road.setTileScale(coverScale, coverScale);
    }
  }

  private createPlayer(height: number): void {
    // Criar carro do jogador
    this.carPlayer = this.physics.add.sprite(this.roadCenterX, height - 100, 'carPlayer');
    this.carPlayer.setOrigin(0.5, 0.5);
    this.carPlayer.setDepth(10);

    // Reduzir tamanho do carro mantendo proporção
    const targetCarHeight = Math.round(height * this.config.playerCarHeight);
    const scale = targetCarHeight / this.carPlayer.height;
    this.carPlayer.setScale(scale);

    // Ajustar corpo físico
    const body = this.carPlayer.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);
    body.setSize(this.carPlayer.displayWidth, this.carPlayer.displayHeight, true);
  }

  private createWalls(height: number): void {
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
  }

  private createGroups(): void {
    // Grupo de obstáculos e checkpoints
    this.obstacles = this.physics.add.group({ allowGravity: false });
    this.checkpoints = this.physics.add.group({ allowGravity: false });
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.carPlayer, this.sideWalls, this.collisionManager.onSideWallHit, undefined, this);
    this.physics.add.overlap(this.carPlayer, this.obstacles, this.collisionManager.onObstacleHit, undefined, this);
    this.physics.add.overlap(this.carPlayer, this.checkpoints, this.onCheckpointCollision, undefined, this);
  }

  private setupInput(): void {
    // Configurar input do carro (touch/mouse)
    this.carPlayer.setInteractive();
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.state.isGameOver) return;
      
      // Verificar se o ponteiro começou sobre o carro
      const bounds = this.carPlayer.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) {
        this.state.pointerOffsetX = this.carPlayer.x - pointer.x;
        this.gameplayManager.startDriving();
      }
    });

    this.input.on('pointerup', () => {
      this.state.pointerOffsetX = 0;
      this.gameplayManager.stopDriving();
    });
  }

  private setupUI(): void {
    // Iniciar cena UI paralela
    if (!this.scene.isActive('UI')) {
      this.scene.launch('UI');
    }
    this.scene.bringToTop('UI');
    
    // Reset HUD de inventário na UI e enviar vidas atuais
    this.game.events.emit('ui-reset-inventory');
    this.game.events.emit('ui-lives', { 
      maxLives: this.config.maxLives, 
      hits: this.state.stats.hits 
    });
  }

  private initializeSystemReferences(): void {
    const { height } = this.cameras.main;
    
    // Inicializar sistemas com referências necessárias
    this.spawnManager.initialize(
      this.obstacles, 
      this.checkpoints, 
      this.roadCenterX, 
      this.roadWidth, 
      height
    );
    
    this.gameplayManager.initialize(
      this.carPlayer,
      this.road,
      this.obstacles,
      this.checkpoints,
      this.roadCenterX,
      this.roadWidth
    );
    
    this.collisionManager.initialize(this.carPlayer);
    this.hudManager.initialize();
    this.audioManager.initialize();
    this.gameOverManager.initialize();
  }

  update(): void {
    // Delegar para o sistema de gameplay
    this.gameplayManager.update();
    
    // Atualizar HUD
    this.hudManager.update();
  }

  private onCheckpointCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    object1,
    object2
  ) => {
    if (this.state.isGameOver) return;
    const checkpoint = (object1 === this.carPlayer ? object2 : object1) as Phaser.Physics.Arcade.Sprite;
    
    // O GameplayManager já trata a lógica de checkpoint, apenas destruir o sprite
    if (checkpoint.active) checkpoint.destroy();
  }

  destroy(): void {
    // Cleanup dos sistemas
    this.spawnManager?.destroy();
    this.gameplayManager?.destroy();
    this.hudManager?.destroy();
    this.audioManager?.destroy();
    this.gameOverManager?.destroy();
  }
}
