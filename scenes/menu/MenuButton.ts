// MenuButton.ts - Componente de botão reutilizável
import { MENU_CONFIG } from './MenuConfig';

export interface ButtonConfig {
  x: number;
  y: number;
  label: string;
  color: number;
  colorHover: number;
  onClick: () => void;
}

export class MenuButton {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(config: ButtonConfig): Phaser.GameObjects.Container {
    const { x, y, label, color, colorHover, onClick } = config;
    const btnWidth = Math.min(
      this.scene.cameras.main.width * MENU_CONFIG.BUTTONS.WIDTH_FACTOR, 
      MENU_CONFIG.BUTTONS.MAX_WIDTH
    );
    const btnHeight = this.getButtonHeight();

    this.container = this.scene.add.container(x, y).setDepth(3);

    this.createShadow(btnWidth, btnHeight);
    this.createBackground(btnWidth, btnHeight, color);
    this.createText(label, btnHeight);
    this.createInteractivity(btnWidth, btnHeight, color, colorHover, onClick);
    this.addAnimation();

    return this.container;
  }

  private createShadow(width: number, height: number): void {
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(MENU_CONFIG.COLORS.SHADOW, 0.35);
    shadow.fillRoundedRect(-width / 2 + 3, -height / 2 + 6, width, height, 14);
    this.container.add(shadow);
  }

  private createBackground(width: number, height: number, color: number): void {
    this.background = this.scene.add.graphics();
    this.updateBackground(width, height, color, 0.25);
    this.container.add(this.background);
  }

  private updateBackground(width: number, height: number, color: number, borderOpacity: number): void {
    this.background.clear();
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    this.background.lineStyle(2, MENU_CONFIG.COLORS.WHITE, borderOpacity);
    this.background.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
  }

  private createText(label: string, height: number): void {
    const text = this.scene.add.text(0, 0, label, {
      font: `bold ${Math.round(height * 0.45)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.container.add(text);
  }

  private createInteractivity(
    width: number, 
    height: number, 
    color: number, 
    colorHover: number, 
    onClick: () => void
  ): void {
    const hitArea = this.scene.add.rectangle(0, 0, width, height, MENU_CONFIG.COLORS.SHADOW, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => this.onHover(width, height, colorHover));
    hitArea.on('pointerout', () => this.onHoverOut(width, height, color));
    hitArea.on('pointerdown', () => this.onClick(onClick));

    this.container.add(hitArea);
  }

  private onHover(width: number, height: number, colorHover: number): void {
    this.container.setScale(1.03);
    this.updateBackground(width, height, colorHover, 0.35);
  }

  private onHoverOut(width: number, height: number, color: number): void {
    this.container.setScale(1);
    this.updateBackground(width, height, color, 0.25);
  }

  private onClick(callback: () => void): void {
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.98,
      duration: MENU_CONFIG.ANIMATIONS.BUTTON_CLICK_DURATION,
      yoyo: true,
      onComplete: callback
    });
  }

  private addAnimation(): void {
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: MENU_CONFIG.ANIMATIONS.BUTTON_PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 150
    });
  }

  private getButtonHeight(): number {
    return Math.round(this.scene.cameras.main.height * MENU_CONFIG.BUTTONS.HEIGHT_FACTOR);
  }

  destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
  }
}
