// Menu.ts - Tela de menu inicial refatorada
import {
  MENU_CONFIG,
  MenuAudioManager,
  MenuBackground,
  MenuButton,
  MenuHeader,
  MenuHelpModal
} from './menu/index';

export class Menu extends Phaser.Scene {
  private background!: MenuBackground;
  private header!: MenuHeader;
  private audioManager!: MenuAudioManager;
  private helpModal?: MenuHelpModal;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.initializeScene();
    this.createComponents();
    this.setupKeyboardControls();
    this.createFooterText();
  }

  update(): void {
    this.background.update();
  }

  private initializeScene(): void {
    this.cameras.main.fadeIn(MENU_CONFIG.ANIMATIONS.FADE_DURATION, 0, 0, 0);
  }

  private createComponents(): void {
    this.background = new MenuBackground(this);
    this.background.create();

    this.header = new MenuHeader(this);
    this.header.create();

    this.audioManager = new MenuAudioManager(this);
    this.audioManager.initialize();

    this.createActionButtons();
  }

  private createActionButtons(): void {
    const { width, height } = this.cameras.main;
    const buttonPositions = this.calculateButtonPositions(height);

    // Botão Jogar
    const playButton = new MenuButton(this);
    playButton.create({
      x: width / 2,
      y: buttonPositions.playY,
      label: '▶ JOGAR',
      color: MENU_CONFIG.COLORS.PRIMARY,
      colorHover: MENU_CONFIG.COLORS.PRIMARY_HOVER,
      onClick: () => this.startGame()
    });

    // Botão Como Jogar
    const helpButton = new MenuButton(this);
    helpButton.create({
      x: width / 2,
      y: buttonPositions.helpY,
      label: 'ℹ COMO JOGAR',
      color: MENU_CONFIG.COLORS.SECONDARY,
      colorHover: MENU_CONFIG.COLORS.SECONDARY_HOVER,
      onClick: () => this.openHelp()
    });
  }

  private calculateButtonPositions(screenHeight: number) {
    const headerY = Math.max(100, screenHeight * MENU_CONFIG.HEADER.POSITION_Y_FACTOR);
    const btnGap = Math.round(screenHeight * MENU_CONFIG.BUTTONS.GAP_FACTOR);
    const buttonHeight = Math.round(screenHeight * MENU_CONFIG.BUTTONS.HEIGHT_FACTOR);
    const startY = Math.min(
      screenHeight * MENU_CONFIG.BUTTONS.START_Y_FACTOR,
      headerY + screenHeight * MENU_CONFIG.BUTTONS.POSITION_OFFSET_FACTOR
    );

    return {
      playY: startY,
      helpY: startY + btnGap + buttonHeight
    };
  }

  private setupKeyboardControls(): void {
    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private createFooterText(): void {
    const { width, height } = this.cameras.main;
    
    this.add.text(
      width / 2,
      height - 36,
      'Enter/Space para jogar  •  Toque no botão',
      {
        font: '14px Arial',
        color: '#bdbdbd',
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setDepth(2);
  }

  private openHelp(): void {
    if (!this.helpModal) {
      this.helpModal = new MenuHelpModal(this);
    }
    this.helpModal.show();
  }

  private startGame(): void {
    this.audioManager.startMusic();
    this.transitionToGame();
  }

  private transitionToGame(): void {
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.registry.set('backgroundMusic', this.audioManager.getBackgroundMusic());
      this.scene.start('Game');
    });
  }

  destroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.background) {
      this.background.destroy();
    }
    if (this.header) {
      this.header.destroy();
    }
    if (this.audioManager) {
      this.audioManager.destroy();
    }
    if (this.helpModal) {
      this.helpModal = undefined;
    }
  }
}
