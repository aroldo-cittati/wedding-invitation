// Menu.ts - Tela de menu inicial do jogo
export class Menu extends Phaser.Scene {
  private backgroundMusic?: Phaser.Sound.BaseSound;
  private playButton?: Phaser.GameObjects.Text;
  private title?: Phaser.GameObjects.Text;
  private subtitle?: Phaser.GameObjects.Text;
  private road?: Phaser.GameObjects.TileSprite;
  private roadSpeed: number = 2; // Velocidade constante da estrada

  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Criar fundo da estrada similar ao jogo
    this.road = this.add.tileSprite(width / 2, height / 2, width, height, 'road');
    this.road.setOrigin(0.5, 0.5);
    this.road.setScrollFactor(0);
    
    // Ajustar a escala do tile para cobrir toda a tela
    const roadTex = this.textures.get('road');
    const src = roadTex.getSourceImage() as HTMLImageElement;
    if (src && src.width && src.height) {
      const tileScaleX = width / src.width;
      const tileScaleY = height / src.height;
      const coverScale = Math.max(tileScaleX, tileScaleY);
      this.road.setTileScale(coverScale, coverScale);
    }

    // Overlay escuro para melhor legibilidade do texto
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    // Título principal
    this.title = this.add.text(width / 2, height / 2 - 80, 'CORRIDA DO AMOR', {
      font: 'bold 32px Arial',
      color: '#ffffff',
      align: 'center',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);

    // Subtítulo
    this.subtitle = this.add.text(width / 2, height / 2 - 30, 'Uma jornada até o altar', {
      font: '18px Arial',
      color: '#cccccc',
      align: 'center',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0.5);

    // Botão Jogar
    this.playButton = this.add.text(width / 2, height / 2 + 40, '▶ JOGAR', {
      font: 'bold 24px Arial',
      color: '#ffffff',
      backgroundColor: '#4CAF50',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    // Efeitos do botão
    this.playButton.on('pointerover', () => {
      this.playButton?.setScale(1.1);
      this.playButton?.setTint(0xffff99);
    });

    this.playButton.on('pointerout', () => {
      this.playButton?.setScale(1.0);
      this.playButton?.clearTint();
    });

    this.playButton.on('pointerdown', () => {
      this.startGame();
    });

    // Animação do botão (pulsando suavemente)
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Inicializar áudio
    this.initializeAudio();

    // Instruções no rodapé
    this.add.text(width / 2, height - 40, 'Use o mouse/touch para controlar seu carro', {
      font: '14px Arial',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5);
  }

  update() {
    // Animar estrada continuamente
    if (this.road) {
      this.road.tilePositionY -= this.roadSpeed;
    }
  }

  private initializeAudio() {
    if (!this.backgroundMusic) {
      this.backgroundMusic = this.sound.add('backgroundMusic', {
        loop: true,
        volume: 0.5
      });
    }
  }

  private startGame() {
    // Iniciar música de fundo
    if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }

    // Efeito de transição
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Passar referência da música para o Game
      this.registry.set('backgroundMusic', this.backgroundMusic);
      this.scene.start('Game');
    });
  }
}
