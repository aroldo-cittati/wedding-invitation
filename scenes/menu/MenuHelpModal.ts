// MenuHelpModal.ts - Modal de ajuda
import { MENU_CONFIG } from './MenuConfig';

export class MenuHelpModal {
  private scene: Phaser.Scene;
  private modalElements: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(): void {
    const { width, height } = this.scene.cameras.main;
    const modalData = this.calculateModalDimensions(width, height);

    this.createOverlay(width, height);
    this.createModal(modalData);
    this.createContent(modalData);
    this.animateAppearance();
  }

  private calculateModalDimensions(screenWidth: number, screenHeight: number) {
    return {
      width: Math.min(screenWidth * MENU_CONFIG.HELP_MODAL.WIDTH_FACTOR, MENU_CONFIG.HELP_MODAL.MAX_WIDTH),
      height: Math.min(screenHeight * MENU_CONFIG.HELP_MODAL.HEIGHT_FACTOR, MENU_CONFIG.HELP_MODAL.MAX_HEIGHT),
      centerX: screenWidth / 2,
      centerY: screenHeight / 2
    };
  }

  private createOverlay(screenWidth: number, screenHeight: number): void {
    const overlay = this.scene.add
      .rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, MENU_CONFIG.COLORS.SHADOW, 0.8)
      .setDepth(10)
      .setInteractive()
      .setAlpha(0);

    overlay.once('pointerdown', () => this.close());
    this.modalElements.push(overlay);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 200
    });
  }

  private createModal(modalData: any): void {
    // Shadow
    const shadow = this.scene.add.graphics().setDepth(11);
    shadow.fillStyle(MENU_CONFIG.COLORS.SHADOW, 0.3);
    shadow.fillRoundedRect(
      modalData.centerX - modalData.width / 2 + MENU_CONFIG.HELP_MODAL.SHADOW_OFFSET.x,
      modalData.centerY - modalData.height / 2 + MENU_CONFIG.HELP_MODAL.SHADOW_OFFSET.y,
      modalData.width,
      modalData.height,
      MENU_CONFIG.HELP_MODAL.BORDER_RADIUS
    );
    this.modalElements.push(shadow);

    // Modal background
    const modal = this.scene.add.graphics().setDepth(12);
    modal.fillStyle(MENU_CONFIG.COLORS.WHITE, 1);
    modal.lineStyle(3, MENU_CONFIG.COLORS.SECONDARY, 1);
    modal.fillRoundedRect(
      modalData.centerX - modalData.width / 2,
      modalData.centerY - modalData.height / 2,
      modalData.width,
      modalData.height,
      MENU_CONFIG.HELP_MODAL.BORDER_RADIUS
    );
    modal.strokeRoundedRect(
      modalData.centerX - modalData.width / 2,
      modalData.centerY - modalData.height / 2,
      modalData.width,
      modalData.height,
      MENU_CONFIG.HELP_MODAL.BORDER_RADIUS
    );
    modal.setScale(0.9).setAlpha(0);
    this.modalElements.push(modal);
  }

  private createContent(modalData: any): void {
    // Title
    const title = this.scene.add.text(
      modalData.centerX,
      modalData.centerY - modalData.height / 2 + 36,
      'Como Jogar',
      {
        font: 'bold 22px Arial',
        color: '#1e88e5'
      }
    )
    .setOrigin(0.5)
    .setDepth(13)
    .setAlpha(0);
    this.modalElements.push(title);

    // Instructions
    const instructions = this.scene.add.text(
      modalData.centerX,
      modalData.centerY + 12,
      '• Toque e arraste sobre o carro para dirigir.\n' +
      '• Desvie de carros e buracos.\n' +
      '• Colete os itens nas placas.\n' +
      '• Após coletar tudo, chegue no seu destino',
      {
        font: '16px Arial',
        color: '#2c3e50',
        align: 'center',
        wordWrap: { width: modalData.width - 40 }
      }
    )
    .setOrigin(0.5)
    .setDepth(13)
    .setAlpha(0);
    this.modalElements.push(instructions);

    // Close button
    this.createCloseButton(modalData);
  }

  private createCloseButton(modalData: any): void {
    const btnW = 120;
    const btnH = 42;

    const btnBg = this.scene.add.graphics().setDepth(12.5);
    btnBg.fillStyle(MENU_CONFIG.COLORS.SECONDARY, 1);
    btnBg.fillRoundedRect(
      modalData.centerX - btnW / 2,
      modalData.centerY + modalData.height / 2 - 28 - btnH / 2,
      btnW,
      btnH,
      12
    );
    btnBg.setAlpha(0);
    this.modalElements.push(btnBg);

    const btn = this.scene.add.text(
      modalData.centerX,
      modalData.centerY + modalData.height / 2 - 28,
      'Fechar',
      {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }
    )
    .setOrigin(0.5)
    .setDepth(13)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });

    btn.once('pointerdown', () => this.close());
    this.modalElements.push(btn);
  }

  private animateAppearance(): void {
    const modalGraphics = this.modalElements.filter(el => 
      el instanceof Phaser.GameObjects.Graphics && el.depth === 12
    );
    const textElements = this.modalElements.filter(el => 
      el instanceof Phaser.GameObjects.Text || (el instanceof Phaser.GameObjects.Graphics && el.depth === 12.5)
    );

    this.scene.tweens.add({
      targets: modalGraphics,
      alpha: 1,
      scale: 1,
      duration: MENU_CONFIG.ANIMATIONS.MODAL_APPEAR_DURATION,
      ease: 'Back.Out'
    });

    this.scene.tweens.add({
      targets: textElements,
      alpha: 1,
      duration: MENU_CONFIG.ANIMATIONS.MODAL_APPEAR_DURATION,
      delay: 120
    });
  }

  private close(): void {
    const modalGraphics = this.modalElements.filter(el => 
      el instanceof Phaser.GameObjects.Graphics && el.depth === 12
    );
    const textElements = this.modalElements.filter(el => 
      el instanceof Phaser.GameObjects.Text || (el instanceof Phaser.GameObjects.Graphics && el.depth === 12.5)
    );

    this.scene.tweens.add({
      targets: textElements,
      alpha: 0,
      duration: 150
    });

    this.scene.tweens.add({
      targets: modalGraphics,
      alpha: 0,
      scale: 0.9,
      duration: MENU_CONFIG.ANIMATIONS.MODAL_DISAPPEAR_DURATION,
      ease: 'Power2',
      onComplete: () => this.destroy()
    });
  }

  private destroy(): void {
    this.modalElements.forEach(element => element.destroy());
    this.modalElements = [];
  }
}
