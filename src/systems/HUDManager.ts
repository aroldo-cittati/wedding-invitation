// HUDManager.ts - Sistema de interface de usuário debug
import type { GameConfiguration } from './GameConfig';
import type { GameState } from './GameState';

export class HUDManager {
  private scene: Phaser.Scene;
  private config: GameConfiguration;
  private state: GameState;
  
  // Elementos de texto
  private speedText?: Phaser.GameObjects.Text;
  private hitsText?: Phaser.GameObjects.Text;
  private distanceText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: GameConfiguration, state: GameState) {
    this.scene = scene;
    this.config = config;
    this.state = state;
  }

  public initialize(): void {
    if (!this.state.showDebugHUD) return;
    
    const { height } = this.scene.cameras.main;
    const centerY = height / 2;
    
    this.speedText = this.scene.add.text(10, centerY - 30, this.getSpeedText(), {
      font: '16px Arial',
      color: '#ffffff'
    }).setDepth(10);
    
    this.hitsText = this.scene.add.text(10, centerY, this.getHitsText(), {
      font: '16px Arial',
      color: '#ffffff'
    }).setDepth(10);
    
    this.distanceText = this.scene.add.text(10, centerY + 30, this.getDistanceText(), {
      font: '16px Arial',
      color: '#ffffff'
    }).setDepth(10);
  }

  public update(): void {
    if (!this.state.showDebugHUD) return;
    
    if (this.speedText) {
      this.speedText.setText(this.getSpeedText());
    }
    
    if (this.hitsText) {
      this.hitsText.setText(this.getHitsText());
    }
    
    if (this.distanceText) {
      this.distanceText.setText(this.getDistanceText());
    }
  }

  private getSpeedText(): string {
    const speed = this.state.isGameOver ? 0 : this.config.gameSpeed;
    const ramp = 1 + this.state.stats.speedRamp;
    return `Vel: ${speed.toFixed(1)} | Rampa: x${ramp.toFixed(2)}`;
  }

  private getHitsText(): string {
    const drivingStatus = this.state.driving ? 'SIM' : 'NÃO';
    return `Hits: ${this.state.stats.hits} | Dirigindo: ${drivingStatus}`;
  }

  private getDistanceText(): string {
    return `Distância: ${this.state.stats.distanceTraveled.toFixed(1)}m`;
  }

  public destroy(): void {
    if (this.speedText) this.speedText.destroy();
    if (this.hitsText) this.hitsText.destroy();
    if (this.distanceText) this.distanceText.destroy();
  }
}
