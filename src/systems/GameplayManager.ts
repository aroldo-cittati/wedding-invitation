// GameplayManager.ts - Gerenciamento da lógica principal do jogo
import type { GameConfiguration } from './GameConfig';
import type { GameState } from './GameState';
import type { CheckpointItem, SpawnManager } from './SpawnManager';

export class GameplayManager {
  private scene: Phaser.Scene;
  private config: GameConfiguration;
  private state: GameState;
  private spawnManager: SpawnManager;
  
  // Componentes do jogo
  private carPlayer!: Phaser.Physics.Arcade.Sprite;
  private road!: Phaser.GameObjects.TileSprite;
  private goalSprite?: Phaser.Physics.Arcade.Sprite;
  
  // Grupos
  private obstacles!: Phaser.Physics.Arcade.Group;
  private checkpoints!: Phaser.Physics.Arcade.Group;
  
  // Timers
  private speedRampEvent!: Phaser.Time.TimerEvent;
  
  // Cache de dimensões
  private roadCenterX: number = 0;
  private roadWidth: number = 0;
  
  constructor(
    scene: Phaser.Scene, 
    config: GameConfiguration, 
    state: GameState, 
    spawnManager: SpawnManager
  ) {
    this.scene = scene;
    this.config = config;
    this.state = state;
    this.spawnManager = spawnManager;
  }

  public initialize(
    carPlayer: Phaser.Physics.Arcade.Sprite,
    road: Phaser.GameObjects.TileSprite,
    obstacles: Phaser.Physics.Arcade.Group,
    checkpoints: Phaser.Physics.Arcade.Group,
    roadCenterX: number,
    roadWidth: number
  ): void {
    this.carPlayer = carPlayer;
    this.road = road;
    this.obstacles = obstacles;
    this.checkpoints = checkpoints;
    this.roadCenterX = roadCenterX;
    this.roadWidth = roadWidth;

    this.setupSpeedRamp();
  }

  private setupSpeedRamp(): void {
    this.speedRampEvent = this.scene.time.addEvent({
      delay: this.config.speedRampInterval,
      loop: true,
      paused: true,
      callback: () => this.increaseSpeedRamp()
    });
  }

  public update(): void {
    if (this.state.isGameOver || this.state.pausedForOverlay) {
      return;
    }

    this.updateGameSpeed();
    this.updatePlayerMovement();
    this.updateRoadMovement();
    this.updateDistance();
    this.updateObstacles();
    this.updateCheckpoints();
    this.updateGoal();
    this.checkCheckpointSpawning();
  }

  private updateGameSpeed(): void {
    const penalized = this.state.isSlowedDown(this.scene.time.now);
    const rampMultiplier = 1 + this.state.stats.speedRamp;
    
    if (this.state.driving) {
      this.config.gameSpeed = (this.config.baseSpeed + this.config.driveBoost) * 
                             rampMultiplier * 
                             (penalized ? this.config.slowDownFactor : 1);
    } else {
      this.config.gameSpeed = this.config.baseSpeed * 
                             rampMultiplier * 
                             (penalized ? this.config.slowDownFactor : 1);
    }
  }

  private updatePlayerMovement(): void {
    if (!this.state.driving || !this.scene.input.activePointer.isDown) {
      // Retornar rotação ao normal quando não está dirigindo
      this.carPlayer.rotation = Phaser.Math.Linear(this.carPlayer.rotation, 0, 0.1);
      return;
    }

    // Steering suave - seguir o pointer
    const targetX = this.scene.input.activePointer.x + this.state.pointerOffsetX;
    const lerpFactor = 0.15;
    
    // Aplicar LERP para movimento suave
    this.carPlayer.x += (targetX - this.carPlayer.x) * lerpFactor;
    
    // Limitar nas bordas da pista
    const roadLeftClamp = this.roadCenterX - this.roadWidth / 2 + this.carPlayer.displayWidth / 2 - 2;
    const roadRightClamp = this.roadCenterX + this.roadWidth / 2 - this.carPlayer.displayWidth / 2 + 2;
    this.carPlayer.x = Phaser.Math.Clamp(this.carPlayer.x, roadLeftClamp, roadRightClamp);
    
    // Efeito de rotação baseado na direção
    const direction = targetX - this.carPlayer.x;
    const maxRotation = 0.2;
    this.carPlayer.rotation = Phaser.Math.Clamp(direction * 0.01, -maxRotation, maxRotation);
  }

  private updateRoadMovement(): void {
    if (!this.state.finalApproach) {
      this.road.tilePositionY -= this.config.gameSpeed;
    }
  }

  private updateDistance(): void {
    if (this.config.gameSpeed > 0) {
      const distance = this.config.gameSpeed * this.config.metersPerPixel;
      this.state.updateDistance(distance);
    }
  }

  private updateObstacles(): void {
    const children = this.obstacles.getChildren() as Phaser.GameObjects.GameObject[];
    
    for (const obj of children) {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      let verticalSpeed = this.config.gameSpeed * this.road.tileScaleY;
      
      // Para carros inimigos, aplicar velocidade relativa
      if (sprite.getData('isDriving')) {
        const relativeSpeed = sprite.getData('relativeSpeed') || 0.75;
        verticalSpeed = this.config.gameSpeed * this.road.tileScaleY * relativeSpeed;
      }
      
      sprite.y += verticalSpeed;
      
      // Remover ao sair da tela
      if (sprite.y - sprite.displayHeight / 2 > this.scene.cameras.main.height + 20) {
        sprite.destroy();
      }
    }
  }

  private updateCheckpoints(): void {
    const children = this.checkpoints.getChildren() as Phaser.GameObjects.GameObject[];
    
    for (const obj of children) {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      sprite.y += this.config.gameSpeed * this.road.tileScaleY;
      
      if (sprite.y - sprite.displayHeight / 2 > this.scene.cameras.main.height + 20) {
        sprite.destroy();
        continue;
      }
      
      // Auto-trigger quando a placa chega na altura do carro
      const triggered = sprite.getData('triggered');
      if (!triggered) {
        const thresholdY = this.carPlayer.y - this.carPlayer.displayHeight * 0.1;
        if (sprite.y >= thresholdY) {
          sprite.setData('triggered', true);
          const item = sprite.getData('cpItem') as CheckpointItem;
          this.triggerCheckpoint(item, sprite);
        }
      }
    }
  }

  private updateGoal(): void {
    if (!this.goalSprite || !this.goalSprite.active) return;
    
    const height = this.scene.cameras.main.height;
    const topStopY = height * 0.18;
    
    if (!this.state.finalApproach) {
      this.goalSprite.y += this.config.gameSpeed * this.road.tileScaleY;
      if (this.goalSprite.y >= topStopY) {
        this.goalSprite.y = topStopY;
        this.startFinalApproach();
      }
    }
    
    // Remover se sair da tela (fallback)
    if (this.goalSprite.y - this.goalSprite.displayHeight / 2 > this.scene.cameras.main.height + 40) {
      this.goalSprite.destroy();
      this.goalSprite = undefined;
    }
  }

  private checkCheckpointSpawning(): void {
    const { stats, checkpoints } = this.state;
    
    // Checkpoint 1: Chave
    if (!checkpoints.cp1Spawned && stats.distanceTraveled >= this.config.cp1Distance) {
      checkpoints.cp1Spawned = true;
      this.spawnManager.spawnCheckpoint('key');
    }
    
    // Checkpoint 2: Mapa
    if (!checkpoints.cp2Spawned && stats.distanceTraveled >= this.config.cp2Distance) {
      checkpoints.cp2Spawned = true;
      this.spawnManager.spawnCheckpoint('map');
    }
    
    // Checkpoint 3: Ticket
    if (!checkpoints.cp3Spawned && stats.distanceTraveled >= this.config.cp3Distance) {
      checkpoints.cp3Spawned = true;
      this.spawnManager.spawnCheckpoint('ticket');
    }
    
    // Goal: se todos os itens foram coletados
    if (this.state.hasAllItems() && 
        !this.state.goalSpawned && 
        checkpoints.lastCheckpointCollected > 0 && 
        stats.distanceTraveled >= checkpoints.lastCheckpointCollected + this.config.goalSpawnDistance) {
      this.spawnGoal();
    }
  }

  private spawnGoal(): void {
    if (this.state.goalSpawned) return;
    
    this.state.goalSpawned = true;
    this.spawnManager.disableSpawning();
    this.goalSprite = this.spawnManager.spawnGoal();
  }

  private triggerCheckpoint(item: CheckpointItem, sprite?: Phaser.Physics.Arcade.Sprite): void {
    if (this.state.isGameOver) return;
    if (sprite && sprite.active) sprite.destroy();

    // Atualizar inventário
    this.state.collectItem(item);

    // Se todos os itens foram coletados
    if (this.state.hasAllItems() && !this.state.goalSpawned) {
      this.state.checkpoints.lastCheckpointCollected = this.state.stats.distanceTraveled;
      this.spawnManager.disableSpawning();
    }

    // Pausar jogabilidade e mostrar overlay
    this.pauseForOverlay();

    // Emitir evento para UI
    this.scene.game.events.emit('ui-checkpoint', { item });
    
    // Aguardar fechamento do overlay
    const resume = () => {
      this.resumeFromOverlay();
      this.scene.game.events.off('ui-checkpoint-closed', resume);
    };
    this.scene.game.events.on('ui-checkpoint-closed', resume);
  }

  private startFinalApproach(): void {
    if (this.state.finalApproach) return;
    this.state.finalApproach = true;
    
    // Pausar spawners
    this.spawnManager.pauseSpawning();
    this.speedRampEvent.paused = true;

    // Reduzir gradualmente a velocidade
    this.scene.tweens.add({
      targets: this.config,
      gameSpeed: 0,
      duration: 500,
      ease: 'Sine.easeOut'
    });

    // Animar carro até próximo do topo
    const targetY = this.goalSprite!.y + this.goalSprite!.displayHeight * 0.45;
    this.scene.tweens.add({
      targets: this.carPlayer,
      y: targetY,
      duration: 700,
      ease: 'Sine.easeInOut',
      onComplete: () => this.triggerGoal()
    });
  }

  private triggerGoal(): void {
    if (!this.goalSprite || this.state.isGameOver) return;
    
    this.pauseForOverlay();
    this.scene.game.events.emit('ui-invite');

    const onRestart = () => {
      this.scene.game.events.off('ui-restart', onRestart);
      this.scene.scene.restart();
    };
    this.scene.game.events.on('ui-restart', onRestart);
  }

  public pauseForOverlay(): void {
    this.state.pausedForOverlay = true;
    this.state.driving = false;
    this.spawnManager.pauseSpawning();
    this.speedRampEvent.paused = true;
  }

  public resumeFromOverlay(): void {
    this.state.pausedForOverlay = false;
    this.spawnManager.resumeSpawning();
    this.speedRampEvent.paused = !this.state.driving;
  }

  public startDriving(): void {
    this.state.driving = true;
    this.spawnManager.resumeSpawning();
    this.speedRampEvent.paused = false;
  }

  public stopDriving(): void {
    this.state.driving = false;
    this.spawnManager.pauseSpawning();
    this.speedRampEvent.paused = true;
  }

  private increaseSpeedRamp(): void {
    this.state.increaseSpeedRamp(this.config.speedRampStep, this.config.speedRampMax);
  }

  public getCurrentGameSpeed(): number {
    return this.config.gameSpeed;
  }

  public destroy(): void {
    if (this.speedRampEvent) this.speedRampEvent.destroy();
  }
}
