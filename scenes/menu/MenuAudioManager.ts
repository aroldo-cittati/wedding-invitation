// MenuAudioManager.ts - Gerenciador de áudio do menu
import { MENU_CONFIG } from './MenuConfig';

export class MenuAudioManager {
  private scene: Phaser.Scene;
  private backgroundMusic?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  initialize(): void {
    if (!this.backgroundMusic) {
      this.backgroundMusic = this.scene.sound.add('backgroundMusic', {
        loop: true,
        volume: MENU_CONFIG.AUDIO.VOLUME
      });
    }
  }

  startMusic(): void {
    if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }
  }

  getBackgroundMusic(): Phaser.Sound.BaseSound | undefined {
    return this.backgroundMusic;
  }

  destroy(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.destroy();
    }
  }
}
