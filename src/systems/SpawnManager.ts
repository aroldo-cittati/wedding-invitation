// SpawnManager.ts - Sistema de spawning de obstáculos e checkpoints
import type { GameConfiguration } from './GameConfig';
import type { GameState } from './GameState';

export type ObstacleType = 'carEnemy1' | 'carEnemy2' | 'pothole';
export type CheckpointItem = 'item1' | 'item2' | 'item3';

export class SpawnManager {
  private scene: Phaser.Scene;
  private config: GameConfiguration;
  private state: GameState;
  
  // Referências dos grupos
  private obstacles!: Phaser.Physics.Arcade.Group;
  private checkpoints!: Phaser.Physics.Arcade.Group;
  
  // Timers
  private spawnEvent!: Phaser.Time.TimerEvent;
  private difficultyEvent!: Phaser.Time.TimerEvent;
  
  // Cache de dimensões
  private roadCenterX: number = 0;
  private roadWidth: number = 0;
  private screenHeight: number = 0;

  constructor(scene: Phaser.Scene, config: GameConfiguration, state: GameState) {
    this.scene = scene;
    this.config = config;
    this.state = state;
  }

  public initialize(
    obstacles: Phaser.Physics.Arcade.Group,
    checkpoints: Phaser.Physics.Arcade.Group,
    roadCenterX: number,
    roadWidth: number,
    screenHeight: number
  ): void {
    this.obstacles = obstacles;
    this.checkpoints = checkpoints;
    this.roadCenterX = roadCenterX;
    this.roadWidth = roadWidth;
    this.screenHeight = screenHeight;

    this.setupTimers();
  }

  private setupTimers(): void {
    // Spawner periódico (inicia pausado)
    this.spawnEvent = this.scene.time.addEvent({
      delay: this.config.spawnDelay,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
      paused: true
    });

    // Timer de aumento de dificuldade
    this.difficultyEvent = this.scene.time.addEvent({
      delay: this.config.difficultyInterval,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true,
      paused: true
    });
  }

  public pauseSpawning(): void {
    if (this.spawnEvent) this.spawnEvent.paused = true;
    if (this.difficultyEvent) this.difficultyEvent.paused = true;
  }

  public resumeSpawning(): void {
    if (!this.state.spawningDisabled && this.state.driving) {
      if (this.spawnEvent) this.spawnEvent.paused = false;
      if (this.difficultyEvent) this.difficultyEvent.paused = false;
    }
  }

  public disableSpawning(): void {
    this.state.spawningDisabled = true;
    this.pauseSpawning();
  }

  private spawnObstacle = (): void => {
    // Verificações básicas
    if (!this.state.driving || this.state.spawningDisabled) return;
    if (this.obstacles.getLength() >= this.config.maxObstaclesOnScreen) return;

    const obstacleType = this.selectObstacleType();
    
    // Verificar distância de segurança para carros
    if (this.isCarType(obstacleType) && !this.canSpawnCarSafely()) {
      return;
    }

    this.createObstacle(obstacleType);
  }

  private selectObstacleType(): ObstacleType {
    const roll = Math.random();
    if (roll < 0.4) return 'pothole';
    if (roll < 0.7) return 'carEnemy1';
    return 'carEnemy2';
  }

  private isCarType(type: ObstacleType): boolean {
    return type === 'carEnemy1' || type === 'carEnemy2';
  }

  private canSpawnCarSafely(): boolean {
    const spawnY = -50;
    const speedFactor = this.getCurrentGameSpeed() / this.config.baseSpeed;
    const dynamicSafeDistance = this.config.minCarSafeDistance + 
                                (this.config.safeDistanceBuffer * speedFactor);

    const existingCars = this.obstacles.getChildren().filter((obstacle) => {
      const sprite = obstacle as Phaser.Physics.Arcade.Sprite;
      return sprite.active && sprite.getData('isDriving') === true;
    }) as Phaser.Physics.Arcade.Sprite[];

    if (existingCars.length === 0) return true;

    for (const car of existingCars) {
      const verticalDistance = Math.abs(car.y - spawnY);
      
      if (verticalDistance < dynamicSafeDistance) return false;
      if (car.y > spawnY && car.y < spawnY + dynamicSafeDistance * 1.5) return false;
    }

    return true;
  }

  private createObstacle(type: ObstacleType): void {
    const sprite = this.obstacles.create(this.roadCenterX, -50, type) as Phaser.Physics.Arcade.Sprite;
    sprite.setOrigin(0.5, 0.5);
    sprite.setImmovable(true);

    this.scaleObstacle(sprite, type);
    this.positionObstacle(sprite);
  }

  private scaleObstacle(sprite: Phaser.Physics.Arcade.Sprite, type: ObstacleType): void {
    let targetHeight: number;
    let depth: number;

    if (type === 'pothole') {
      targetHeight = Math.round(this.screenHeight * this.config.potholeHeight);
      depth = 1;
    } else {
      targetHeight = Math.round(this.screenHeight * this.config.enemyCarHeight);
      depth = 2;
      
      // Configurar movimento para carros inimigos
      sprite.setData('isDriving', true);
      sprite.setData('relativeSpeed', 0.55);
    }

    sprite.setScale(targetHeight / sprite.height);
    sprite.setDepth(depth);
  }

  private positionObstacle(sprite: Phaser.Physics.Arcade.Sprite): void {
    const roadLeft = this.roadCenterX - this.roadWidth / 3;
    const roadRight = this.roadCenterX + this.roadWidth / 3;
    const halfWidth = sprite.displayWidth / 2;
    const minX = Math.floor(roadLeft + halfWidth);
    const maxX = Math.floor(roadRight - halfWidth);
    
    sprite.x = Phaser.Math.Between(minX, Math.max(minX, maxX));
  }

  public spawnCheckpoint(item: CheckpointItem): void {
    const { width } = this.scene.cameras.main;
    const offset = 50;
    const sprite = this.checkpoints.create(width - offset, -40, 'checkpointSign') as Phaser.Physics.Arcade.Sprite;
    
    sprite.setOrigin(0.5, 0.5);
    const targetHeight = Math.round(this.screenHeight * this.config.checkpointHeight);
    sprite.setScale(targetHeight / sprite.height);
    sprite.setData('cpItem', item);
    sprite.setData('triggered', false);
    sprite.setDepth(2);
  }

  public spawnGoal(): Phaser.Physics.Arcade.Sprite {
    const sprite = this.scene.physics.add.sprite(this.roadCenterX, -60, 'houseGoal');
    sprite.setOrigin(0.5, 0.5);
    
    const targetHeight = Math.round(this.screenHeight * this.config.goalHeight);
    sprite.setScale(targetHeight / sprite.height);
    sprite.setDepth(3);
    sprite.setImmovable(true);
    
    return sprite;
  }

  private increaseDifficulty = (): void => {
    if (this.config.spawnDelay > this.config.minSpawnDelay) {
      this.config.spawnDelay = Math.max(this.config.minSpawnDelay, this.config.spawnDelay - this.config.spawnStep);
      
      // Recriar evento com novo delay
      this.spawnEvent.remove(false);
      this.spawnEvent = this.scene.time.addEvent({
        delay: this.config.spawnDelay,
        callback: this.spawnObstacle,
        callbackScope: this,
        loop: true,
        paused: this.state.spawningDisabled || !this.state.driving
      });
    }
  }

  private getCurrentGameSpeed(): number {
    // Este método deveria ser injetado ou ter acesso ao GameplayManager
    // Por enquanto, vamos usar uma estimativa baseada no estado
    const penalized = this.state.isSlowedDown(this.scene.time.now);
    const rampMultiplier = 1 + this.state.stats.speedRamp;
    
    if (this.state.driving) {
      return (this.config.baseSpeed + this.config.driveBoost) * rampMultiplier * (penalized ? this.config.slowDownFactor : 1);
    } else {
      return this.config.baseSpeed * rampMultiplier * (penalized ? this.config.slowDownFactor : 1);
    }
  }

  public destroy(): void {
    if (this.spawnEvent) this.spawnEvent.destroy();
    if (this.difficultyEvent) this.difficultyEvent.destroy();
  }
}
