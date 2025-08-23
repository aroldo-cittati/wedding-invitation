// CollisionManager.ts - Sistema de gerenciamento de colisões
import type { GameConfiguration } from './GameConfig';
import type { GameState } from './GameState';

export class CollisionManager {
  private scene: Phaser.Scene;
  private config: GameConfiguration;
  private state: GameState;
  private carPlayer!: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, config: GameConfiguration, state: GameState) {
    this.scene = scene;
    this.config = config;
    this.state = state;
  }

  public initialize(carPlayer: Phaser.Physics.Arcade.Sprite): void {
    this.carPlayer = carPlayer;
  }

  public onObstacleHit = (): void => {
    if (this.state.invincible || this.state.isGameOver) return;
    
    this.state.invincible = true;
    this.state.takeDamage();
    
    // Emitir evento para UI atualizar vidas
    this.scene.game.events.emit('ui-lives', { 
      maxLives: this.config.maxLives, 
      hits: this.state.stats.hits 
    });

    // Verificar Game Over
    if (this.state.stats.hits >= this.config.maxLives) {
      this.triggerGameOver();
      return;
    }

    // Aplicar penalidade de velocidade
    this.state.slowDownUntil = this.scene.time.now + this.config.slowDownDuration;

    // Efeito visual de piscar
    this.scene.tweens.add({
      targets: this.carPlayer,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 5
    });

    // Remover invencibilidade após duração configurada
    this.scene.time.delayedCall(this.config.invincibilityDuration, () => {
      this.state.invincible = false;
      this.carPlayer.setAlpha(1);
    });
  }

  public onSideWallHit = (object1: any, object2: any): void => {
    // Descobrir qual objeto é a parede
    const wallObject = (object1 === this.carPlayer ? object2 : object1) as any;
    const side = wallObject.getData ? wallObject.getData('side') as 'left' | 'right' | undefined : undefined;
    
    if (!side) return;
    
    const pushDistance = side === 'left' ? 12 : -12;
    
    // Penalidade curta
    this.state.slowDownUntil = Math.max(
      this.state.slowDownUntil, 
      this.scene.time.now + 300
    );
    
    // Empurrão de volta para o centro
    this.scene.tweens.add({
      targets: this.carPlayer,
      x: this.carPlayer.x + pushDistance,
      duration: 90,
      ease: 'Sine.easeOut'
    });
    
    // Tremor sutil para feedback
    this.scene.cameras.main.shake(60, 0.001);
  }

  private triggerGameOver(): void {
    if (this.state.isGameOver) return;
    
    this.state.isGameOver = true;
    this.state.driving = false;
    
    // Pausar física
    this.scene.physics.world.pause();
    
    // Emitir evento para que o Game gerencie o overlay de Game Over
    this.scene.game.events.emit('game-over');
  }
}
