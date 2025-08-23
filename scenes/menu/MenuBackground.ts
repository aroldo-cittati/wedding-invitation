// MenuBackground.ts - Gerenciador do background animado
import { MENU_CONFIG } from './MenuConfig';

export class MenuBackground {
  private scene: Phaser.Scene;
  private road!: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.setupRoad();
    this.createVignette();
  }

  update(): void {
    if (this.road) {
      this.road.tilePositionY -= MENU_CONFIG.BACKGROUND.ROAD_SPEED;
    }
  }

  private setupRoad(): void {
    const { width, height } = this.scene.cameras.main;
    
    this.road = this.scene.add
      .tileSprite(width / 2, height / 2, width, height, 'road')
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.scaleRoadToFit(width, height);
  }

  private scaleRoadToFit(screenWidth: number, screenHeight: number): void {
    const roadTexture = this.scene.textures.get('road');
    const sourceImage = roadTexture.getSourceImage() as HTMLImageElement | undefined;
    
    if (!sourceImage) return;

    const { width: textureWidth, height: textureHeight } = sourceImage;
    
    if (textureWidth > 0 && textureHeight > 0) {
      const coverScale = Math.max(
        screenWidth / textureWidth, 
        screenHeight / textureHeight
      );
      this.road.setTileScale(coverScale, coverScale);
    }
  }

  private createVignette(): void {
    const { width, height } = this.scene.cameras.main;
    
    this.scene.add
      .graphics()
      .fillStyle(MENU_CONFIG.COLORS.VIGNETTE, MENU_CONFIG.BACKGROUND.VIGNETTE_OPACITY)
      .fillRect(0, 0, width, height)
      .setDepth(1);
  }

  destroy(): void {
    if (this.road) {
      this.road.destroy();
    }
  }
}
