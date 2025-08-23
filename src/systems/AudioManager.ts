// AudioManager.ts - Sistema de gerenciamento de áudio
import type { GameConfiguration } from './GameConfig';
import type { GameState } from './GameState';

export class AudioManager {
  private scene: Phaser.Scene;
  private config: GameConfiguration;
  private state: GameState;
  private backgroundMusic?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, config: GameConfiguration, state: GameState) {
    this.scene = scene;
    this.config = config;
    this.state = state;
  }

  public initialize(): void {
    this.setupBackgroundMusic();
    this.setupEventListeners();
  }

  private setupBackgroundMusic(): void {
    // Tentar obter música existente do Registry
    const existingMusic = this.scene.registry.get('backgroundMusic') as Phaser.Sound.BaseSound;
    
    if (existingMusic) {
      this.backgroundMusic = existingMusic;
      
      // Garantir que está tocando se habilitada
      if (this.state.musicEnabled && !this.backgroundMusic.isPlaying) {
        this.backgroundMusic.play();
      }
    } else {
      // Criar nova instância
      this.backgroundMusic = this.scene.sound.add('backgroundMusic', {
        loop: true,
        volume: this.config.musicVolume
      });
      
      // Tentar iniciar música se habilitada
      if (this.state.musicEnabled) {
        this.tryPlayBackgroundMusic();
      }
    }
  }

  private setupEventListeners(): void {
    // Remover listener anterior se existir
    this.scene.game.events.off('ui-toggle-music');
    
    // Listener para controle de música da UI
    this.scene.game.events.on('ui-toggle-music', (enabled: boolean) => {
      this.state.musicEnabled = enabled;
      if (enabled) {
        this.playBackgroundMusic();
      } else {
        this.pauseBackgroundMusic();
      }
    });
  }

  private tryPlayBackgroundMusic(): void {
    if (this.backgroundMusic && this.state.musicEnabled && !this.backgroundMusic.isPlaying) {
      try {
        this.backgroundMusic.play();
      } catch (error) {
        console.warn('Não foi possível reproduzir a música de fundo:', error);
      }
    }
  }

  public playBackgroundMusic(): void {
    this.tryPlayBackgroundMusic();
  }

  public pauseBackgroundMusic(): void {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.pause();
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
  }

  public preserveMusicForRestart(): void {
    if (this.backgroundMusic && this.state.musicEnabled) {
      // Armazenar referência da música no Registry para o restart
      this.scene.registry.set('backgroundMusic', this.backgroundMusic);
    }
  }

  public destroy(): void {
    this.scene.game.events.off('ui-toggle-music');
  }
}
