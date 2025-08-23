export interface SoundButtonConfig {
  margin: number;
  fontSize: string;
  color: string;
  hoverColor: number;
}

export class SoundButtonComponent {
  private scene: Phaser.Scene;
  private soundButton!: Phaser.GameObjects.Text;
  private musicEnabled: boolean = true;
  private config: SoundButtonConfig;

  constructor(scene: Phaser.Scene, config?: Partial<SoundButtonConfig>) {
    this.scene = scene;
    this.config = {
      margin: 20,
      fontSize: 'bold 24px Arial',
      color: '#ffffff',
      hoverColor: 0xffff00,
      ...config
    };
  }

  create(): void {
    const { width } = this.scene.cameras.main;
    const { margin, fontSize, color } = this.config;
    
    this.soundButton = this.scene.add.text(width - margin, margin, '♪', {
      font: fontSize,
      color: color,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
    })
    .setOrigin(1, 0)
    .setDepth(100)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

    this.setupEvents();
    this.updateAppearance();
  }

  private setupEvents(): void {
    this.soundButton.on('pointerdown', () => {
      this.toggle();
    });

    this.soundButton.on('pointerover', () => {
      this.soundButton.setTint(this.config.hoverColor);
    });

    this.soundButton.on('pointerout', () => {
      this.soundButton.clearTint();
    });
  }

  toggle(): void {
    this.musicEnabled = !this.musicEnabled;
    this.updateAppearance();
    this.scene.game.events.emit('ui-toggle-music', this.musicEnabled);
  }

  private updateAppearance(): void {
    if (this.soundButton) {
      this.soundButton.setText(this.musicEnabled ? '♪' : '♪̸');
      this.soundButton.setAlpha(this.musicEnabled ? 1.0 : 0.5);
    }
  }

  setEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    this.updateAppearance();
  }

  isEnabled(): boolean {
    return this.musicEnabled;
  }

  destroy(): void {
    if (this.soundButton) {
      this.soundButton.destroy();
    }
  }
}
