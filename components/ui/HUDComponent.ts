import type { InventoryState } from './InventoryManager';

export interface HUDConfig {
  margin: number;
  padding: number;
  iconSize: number;
  gap: number;
  borderRadius: number;
}

export class HUDComponent {
  private scene: Phaser.Scene;
  private hudContainer!: Phaser.GameObjects.Container;
  private hudBackground!: Phaser.GameObjects.Graphics;
  private icons!: { item1: Phaser.GameObjects.Image; item2: Phaser.GameObjects.Image; item3: Phaser.GameObjects.Image };
  private livesText!: Phaser.GameObjects.Text;
  private iconOriginalScales!: { item1: number; item2: number; item3: number };
  private config: HUDConfig;

  constructor(scene: Phaser.Scene, config?: Partial<HUDConfig>) {
    this.scene = scene;
    this.config = {
      margin: 12,
      padding: 8,
      iconSize: Math.round(scene.cameras.main.height * 0.05),
      gap: 6,
      borderRadius: 8,
      ...config
    };
  }

  create(): void {
    const { width, height } = this.scene.cameras.main;
    this.createHUDContainer(width, height);
    this.createIcons();
    this.createLivesText();
  }

  private createHUDContainer(_width: number, _height: number): void {
    const { margin, padding, iconSize, gap } = this.config;
    
    const hudWidth = (iconSize * 3) + (gap * 2) + (padding * 2);
    const hudHeight = iconSize + 32 + (padding * 2);
    
    this.hudContainer = this.scene.add.container(margin + hudWidth / 2, margin + hudHeight / 2);
    this.hudContainer.setDepth(100).setScrollFactor(0);
    
    this.hudBackground = this.scene.add.graphics();
    this.hudBackground.fillStyle(0x000000, 0.4);
    this.hudBackground.fillRoundedRect(-hudWidth / 2, -hudHeight / 2, hudWidth, hudHeight, this.config.borderRadius);
    this.hudBackground.lineStyle(1, 0xffffff, 0.3);
    this.hudBackground.strokeRoundedRect(-hudWidth / 2, -hudHeight / 2, hudWidth, hudHeight, this.config.borderRadius);
    
    this.hudContainer.add(this.hudBackground);
  }

  private createIcons(): void {
    const { padding, iconSize, gap } = this.config;
    const hudWidth = (iconSize * 3) + (gap * 2) + (padding * 2);
    const hudHeight = iconSize + 32 + (padding * 2);
    
    const startX = -hudWidth / 2 + padding + iconSize / 2;
    const iconsY = -hudHeight / 2 + padding + iconSize / 2;
    
    const positions = {
      item1: startX,
      item2: startX + iconSize + gap,
      item3: startX + (iconSize + gap) * 2
    };

    const item1Icon = this.scene.add.image(positions.item1, iconsY, 'item1_icon').setOrigin(0.5);
    const item2Icon = this.scene.add.image(positions.item2, iconsY, 'item2_icon').setOrigin(0.5);
    const item3Icon = this.scene.add.image(positions.item3, iconsY, 'item3_icon').setOrigin(0.5);
    
    const item1Scale = iconSize / item1Icon.height;
    const item2Scale = iconSize / item2Icon.height;
    const item3Scale = iconSize / item3Icon.height;
    
    item1Icon.setScale(item1Scale);
    item2Icon.setScale(item2Scale);
    item3Icon.setScale(item3Scale);
    
    this.iconOriginalScales = { item1: item1Scale, item2: item2Scale, item3: item3Scale };
    this.icons = { item1: item1Icon, item2: item2Icon, item3: item3Icon };
    
    this.hudContainer.add([item1Icon, item2Icon, item3Icon]);
  }

  private createLivesText(): void {
    const { padding, iconSize } = this.config;
    const hudHeight = iconSize + 32 + (padding * 2);
    const iconsY = -hudHeight / 2 + padding + iconSize / 2;
    
    this.livesText = this.scene.add.text(
      0,
      iconsY + iconSize / 2 + 18,
      '',
      { 
        font: 'bold 12px Arial', 
        color: '#ffffff',
        align: 'center',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
      }
    ).setOrigin(0.5);
    
    this.hudContainer.add(this.livesText);
  }

  updateInventory(inventory: InventoryState): void {
    this.updateIconState(this.icons.item1, inventory.item1);
    this.updateIconState(this.icons.item2, inventory.item2);
    this.updateIconState(this.icons.item3, inventory.item3);
  }

  private updateIconState(icon: Phaser.GameObjects.Image, collected: boolean): void {
    const collectedTint = 0xffffff;
    const collectedAlpha = 1.0;
    const unCollectedTint = 0x666666;
    const unCollectedAlpha = 0.4;
    
    const targetTint = collected ? collectedTint : unCollectedTint;
    const targetAlpha = collected ? collectedAlpha : unCollectedAlpha;
    
    let originalScale = 1;
    if (icon === this.icons.item1) originalScale = this.iconOriginalScales.item1;
    else if (icon === this.icons.item2) originalScale = this.iconOriginalScales.item2;
    else if (icon === this.icons.item3) originalScale = this.iconOriginalScales.item3;
    
    if (collected && icon.tint !== collectedTint) {
      this.scene.tweens.add({
        targets: icon,
        tint: 0xffdd00,
        scaleX: originalScale * 1.3,
        scaleY: originalScale * 1.3,
        duration: 200,
        ease: 'Power2',
        yoyo: true,
        onComplete: () => {
          icon.setTint(targetTint);
          icon.setScale(originalScale);
        }
      });
      
      this.scene.tweens.add({
        targets: icon,
        alpha: targetAlpha,
        duration: 300,
        ease: 'Power2'
      });
    } else {
      icon.setTint(targetTint);
      icon.setAlpha(targetAlpha);
      icon.setScale(originalScale);
    }
  }

  updateLives(maxLives: number, hits: number): void {
    const livesLeft = Math.max(0, maxLives - hits);
    
    let livesDisplay = '';
    for (let i = 0; i < livesLeft; i++) {
      livesDisplay += '❤️ ';
    }
    for (let i = 0; i < maxLives - livesLeft; i++) {
      livesDisplay += '💔 ';
    }
    
    this.livesText.setText(livesDisplay.trim());
    
    if (hits > 0 && livesLeft > 0) {
      this.scene.tweens.add({
        targets: this.livesText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          this.livesText.setScale(1);
        }
      });
    }
  }

  destroy(): void {
    if (this.hudContainer) {
      this.hudContainer.destroy();
    }
  }
}
