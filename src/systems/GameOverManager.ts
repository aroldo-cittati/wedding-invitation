// GameOverManager.ts - Sistema de gerenciamento de Game Over
import type { AudioManager } from './AudioManager';
import type { GameState } from './GameState';

export class GameOverManager {
  private scene: Phaser.Scene;
  private state: GameState;
  private audioManager: AudioManager;
  
  // Elementos do overlay
  private overlay?: Phaser.GameObjects.Rectangle;
  private title?: Phaser.GameObjects.Text;
  private playAgainButton?: Phaser.GameObjects.Text;
  private menuButton?: Phaser.GameObjects.Text;
  private playAgainBg?: Phaser.GameObjects.Graphics;
  private menuBg?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, state: GameState, audioManager: AudioManager) {
    this.scene = scene;
    this.state = state;
    this.audioManager = audioManager;
  }

  public initialize(): void {
    // Listener para evento de game over
    this.scene.game.events.on('game-over', this.showGameOver);
  }

  private showGameOver = (): void => {
    if (this.state.isGameOver && this.overlay) return; // Já está sendo exibido
    
    // Parar música de fundo
    this.audioManager.stopBackgroundMusic();
    
    // Usar bringToTop temporariamente para o input do Game Over
    this.scene.scene.bringToTop();
    
    this.createOverlay();
    this.createButtons();
    this.setupButtonEvents();
  }

  private createOverlay(): void {
    const { width, height } = this.scene.cameras.main;
    
    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setDepth(200)
      .setInteractive();
      
    this.title = this.scene.add.text(width / 2, height / 2 - 30, 'GAME OVER', {
      font: '28px Arial',
      color: '#ffffff'
    })
      .setOrigin(0.5)
      .setDepth(201);
  }

  private createButtons(): void {
    const { width, height } = this.scene.cameras.main;
    
    // Configurações dos botões
    const playAgainConfig = {
      x: width / 2,
      y: height / 2 + 20,
      width: 200,
      height: 40,
      text: '🔄 JOGAR NOVAMENTE',
      color: 0x4CAF50,
      hoverColor: 0x66BB6A
    };
    
    const menuConfig = {
      x: width / 2,
      y: height / 2 + 80,
      width: 120,
      height: 40,
      text: '🏠 MENU',
      color: 0x2196F3,
      hoverColor: 0x42A5F5
    };
    
    // Criar botão "Jogar Novamente"
    this.playAgainBg = this.createButtonBackground(playAgainConfig);
    this.playAgainButton = this.createButtonText(playAgainConfig);
    
    // Criar botão "Menu"
    this.menuBg = this.createButtonBackground(menuConfig);
    this.menuButton = this.createButtonText(menuConfig);
  }

  private createButtonBackground(config: any): Phaser.GameObjects.Graphics {
    const bg = this.scene.add.graphics();
    bg.fillStyle(config.color, 1);
    bg.fillRoundedRect(
      config.x - config.width / 2,
      config.y - config.height / 2,
      config.width,
      config.height,
      8
    );
    bg.setDepth(201);
    return bg;
  }

  private createButtonText(config: any): Phaser.GameObjects.Text {
    return this.scene.add.text(config.x, config.y, config.text, {
      font: 'bold 16px Arial',
      color: '#ffffff',
      padding: { x: 15, y: 8 }
    })
      .setOrigin(0.5)
      .setDepth(202)
      .setInteractive({ useHandCursor: true });
  }

  private setupButtonEvents(): void {
    if (!this.playAgainButton || !this.menuButton) return;
    
    const { width, height } = this.scene.cameras.main;
    
    // Eventos do botão "Jogar Novamente"
    this.playAgainButton.on('pointerover', () => {
      this.playAgainButton!.setTint(0xffff99);
      this.updateButtonBackground(this.playAgainBg!, width / 2, height / 2 + 20, 200, 40, 0x66BB6A);
    });
    
    this.playAgainButton.on('pointerout', () => {
      this.playAgainButton!.clearTint();
      this.updateButtonBackground(this.playAgainBg!, width / 2, height / 2 + 20, 200, 40, 0x4CAF50);
    });
    
    this.playAgainButton.on('pointerdown', this.handlePlayAgain);
    
    // Eventos do botão "Menu"
    this.menuButton.on('pointerover', () => {
      this.menuButton!.setTint(0xffff99);
      this.updateButtonBackground(this.menuBg!, width / 2, height / 2 + 80, 120, 40, 0x42A5F5);
    });
    
    this.menuButton.on('pointerout', () => {
      this.menuButton!.clearTint();
      this.updateButtonBackground(this.menuBg!, width / 2, height / 2 + 80, 120, 40, 0x2196F3);
    });
    
    this.menuButton.on('pointerdown', this.handleBackToMenu);
  }

  private updateButtonBackground(
    bg: Phaser.GameObjects.Graphics, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: number
  ): void {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
  }

  private handlePlayAgain = (): void => {
    if (this.state.restarting) return;
    this.state.restarting = true;
    
    // Preservar música para o restart
    this.audioManager.preserveMusicForRestart();
    
    this.scene.scene.restart();
  }

  private handleBackToMenu = (): void => {
    if (this.state.restarting) return;
    this.state.restarting = true;
    this.scene.scene.start('Menu');
  }

  public destroy(): void {
    this.scene.game.events.off('game-over', this.showGameOver);
    
    if (this.overlay) this.overlay.destroy();
    if (this.title) this.title.destroy();
    if (this.playAgainButton) this.playAgainButton.destroy();
    if (this.menuButton) this.menuButton.destroy();
    if (this.playAgainBg) this.playAgainBg.destroy();
    if (this.menuBg) this.menuBg.destroy();
  }
}
