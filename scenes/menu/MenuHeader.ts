// MenuHeader.ts - Componente do cabeçalho do menu
import { MENU_CONFIG } from './MenuConfig';

export class MenuHeader {
  private scene: Phaser.Scene;
  private heroCar!: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const { width, height } = this.scene.cameras.main;
    const headerY = this.getHeaderY(height);

    this.createTitle(width, height, headerY);
    this.createSubtitle(width, height, headerY);
    this.createHeroCar(width, height, headerY);
  }

  private createTitle(screenWidth: number, screenHeight: number, headerY: number): void {
    const title = this.scene.add.text(screenWidth / 2, headerY, 'CORRIDA DO AMOR', {
      font: `bold ${Math.round(screenHeight * MENU_CONFIG.HEADER.TITLE_SCALE)}px Arial`,
      color: '#ffffff',
      align: 'center',
      stroke: MENU_CONFIG.HEADER.TITLE_STROKE,
      strokeThickness: 6,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: '#000000', 
        blur: 8, 
        fill: true 
      }
    })
    .setOrigin(0.5)
    .setDepth(2);

    this.fitTextToWidth(title, Math.round(screenWidth * MENU_CONFIG.HEADER.TITLE_MAX_WIDTH_FACTOR));
  }

  private createSubtitle(screenWidth: number, screenHeight: number, headerY: number): void {
    this.scene.add.text(
      screenWidth / 2, 
      headerY + Math.round(screenHeight * 0.06), 
      'Uma jornada até o altar', 
      {
        font: `bold ${Math.round(screenHeight * MENU_CONFIG.HEADER.SUBTITLE_SCALE)}px Arial`,
        color: '#e0e0e0',
        align: 'center',
        shadow: { 
          offsetX: 0, 
          offsetY: 0, 
          color: '#000000', 
          blur: 4, 
          fill: true 
        }
      }
    )
    .setOrigin(0.5)
    .setDepth(2);
  }

  private createHeroCar(screenWidth: number, screenHeight: number, headerY: number): void {
    const carSize = Math.round(screenHeight * MENU_CONFIG.HEADER.CAR_SCALE);
    
    this.heroCar = this.scene.add
      .sprite(screenWidth / 2, headerY - carSize * 0.9, 'carPlayer')
      .setDepth(2);

    if (this.heroCar.height) {
      this.heroCar.setScale(carSize / this.heroCar.height);
    }

    this.animateHeroCar(screenHeight);
  }

  private animateHeroCar(screenHeight: number): void {
    this.scene.tweens.add({
      targets: this.heroCar,
      y: `+=${Math.round(screenHeight * MENU_CONFIG.HEADER.CAR_ANIMATION_OFFSET_FACTOR)}`,
      angle: { from: -2, to: 2 },
      duration: MENU_CONFIG.ANIMATIONS.CAR_FLOAT_DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private getHeaderY(screenHeight: number): number {
    return Math.max(100, screenHeight * MENU_CONFIG.HEADER.POSITION_Y_FACTOR);
  }

  private fitTextToWidth(text: Phaser.GameObjects.Text, maxWidth: number): void {
    text.setScale(1);
    if (text.width > maxWidth) {
      const scale = maxWidth / text.width;
      text.setScale(scale);
    }
  }

  destroy(): void {
    if (this.heroCar) {
      this.heroCar.destroy();
    }
  }
}
