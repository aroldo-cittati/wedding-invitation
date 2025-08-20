// Menu.ts - Tela de menu inicial com visual moderno
export class Menu extends Phaser.Scene {
  // Background e elementos de cena
  private road!: Phaser.GameObjects.TileSprite;
  private roadSpeed: number = 2.2;
  // Áudio
  private backgroundMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super('Menu');
  }

  create() {
  // Fade in e construção em helpers para reduzir complexidade
  this.cameras.main.fadeIn(400, 0, 0, 0);
  this.setupBackground();
  this.createHeader();
  this.createButtons();
  this.initializeAudio();
  }

  update() {
    // Rolagem suave da estrada
    this.road.tilePositionY -= this.roadSpeed;
  }

  // ...sem partículas por simplicidade/compatibilidade

  // Cria um botão chamativo com sombra, borda e hover
  private createCTAButton(opts: { x: number; y: number; label: string; color: number; colorHover: number; onClick: () => void; }) {
    const { x, y, label, color, colorHover, onClick } = opts;
    const btnWidth = Math.min(this.cameras.main.width * 0.7, 300);
    const btnHeight = this.getButtonHeight();

    const container = this.add.container(x, y).setDepth(3);

    // Sombra
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(-btnWidth / 2 + 3, -btnHeight / 2 + 6, btnWidth, btnHeight, 14);

    // Botão
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
    bg.lineStyle(2, 0xffffff, 0.25);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);

  const txt = this.add.text(0, 0, label, {
      font: `bold ${Math.round(btnHeight * 0.45)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5);

    // Área de clique invisível (para captar eventos de hover/out/press)
    const hitArea = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // Efeitos hover
    hitArea.on('pointerover', () => {
      container.setScale(1.03);
      bg.clear();
      bg.fillStyle(colorHover, 1);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
      bg.lineStyle(2, 0xffffff, 0.35);
      bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
    });

    hitArea.on('pointerout', () => {
      container.setScale(1);
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
      bg.lineStyle(2, 0xffffff, 0.25);
      bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.98, duration: 70, yoyo: true });
      onClick();
    });

    // Animação sutil para dar vida
    this.tweens.add({
      targets: container,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 150
    });

    container.add([shadow, bg, txt, hitArea]);
    return container;
  }

  private getButtonHeight() {
    return Math.round(this.cameras.main.height * 0.08);
  }

  // Fundo e escala do tileSprite da estrada + vignette
  private setupBackground() {
    const { width, height } = this.cameras.main;
    this.road = this.add.tileSprite(width / 2, height / 2, width, height, 'road')
      .setOrigin(0.5)
      .setScrollFactor(0);
    const roadTex = this.textures.get('road');
    const src = roadTex.getSourceImage() as HTMLImageElement | undefined;
    if (src) {
      const sw = src.width || 0;
      if (sw > 0) {
        const sh = src.height || 0;
        if (sh > 0) {
          const coverScale = Math.max(width / sw, height / sh);
          this.road.setTileScale(coverScale, coverScale);
        }
      }
    }
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.55).fillRect(0, 0, width, height).setDepth(1);
  }

  // Cabeçalho: título, subtítulo e carro animado
  private createHeader() {
    const { width, height } = this.cameras.main;
    const headerY = Math.max(100, height * 0.26);
    const title = this.add.text(width / 2, headerY, 'CORRIDA DO AMOR', {
      font: `bold ${Math.round(height * 0.07)}px Arial`,
      color: '#ffffff',
      align: 'center',
      stroke: '#e91e63',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5).setDepth(2);
    this.fitTextToWidth(title, Math.round(width * 0.9));

    this.add.text(width / 2, headerY + Math.round(height * 0.06), 'Uma jornada até o altar', {
      font: `bold ${Math.round(height * 0.03)}px Arial`,
      color: '#e0e0e0',
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(2);

    const carSize = Math.round(height * 0.14);
    const heroCar = this.add.sprite(width / 2, headerY - carSize * 0.9, 'carPlayer').setDepth(2);
    if (heroCar.height) heroCar.setScale(carSize / heroCar.height);
    this.tweens.add({
      targets: heroCar,
      y: `+=${Math.round(height * 0.02)}`,
      angle: { from: -2, to: 2 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // Botões de ação e atalhos de teclado
  private createButtons() {
    const { width, height } = this.cameras.main;
    const headerY = Math.max(100, height * 0.26);
    const btnGap = Math.round(height * 0.02);
    const startY = Math.min(height * 0.66, headerY + height * 0.28);
    this.createCTAButton({ x: width / 2, y: startY, label: '▶ JOGAR', color: 0x43a047, colorHover: 0x2e7d32, onClick: () => this.startGame() });
    this.createCTAButton({ x: width / 2, y: startY + (btnGap + this.getButtonHeight()), label: 'ℹ COMO JOGAR', color: 0x1e88e5, colorHover: 0x1565c0, onClick: () => this.openHelp() });
    this.add.text(width / 2, height - 36, 'Enter/Space para jogar  •  Toque no botão', { font: '14px Arial', color: '#bdbdbd', align: 'center' }).setOrigin(0.5).setDepth(2);
    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  // Ajusta a escala do texto para caber em uma largura máxima
  private fitTextToWidth(text: Phaser.GameObjects.Text, maxWidth: number) {
    // Reset escala antes de medir
    text.setScale(1);
    if (text.width > maxWidth) {
      const scale = maxWidth / text.width;
      text.setScale(scale);
    }
  }

  private openHelp() {
    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(10)
      .setInteractive()
      .setAlpha(0);

    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 200 });

    const modalW = Math.min(width * 0.85, 360);
    const modalH = Math.min(height * 0.7, 420);
    const shadow = this.add.graphics().setDepth(11);
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(width / 2 - modalW / 2 + 4, height / 2 - modalH / 2 + 6, modalW, modalH, 18);

    const modal = this.add.graphics().setDepth(12);
    modal.fillStyle(0xffffff, 1);
    modal.lineStyle(3, 0x1e88e5, 1);
    modal.fillRoundedRect(width / 2 - modalW / 2, height / 2 - modalH / 2, modalW, modalH, 18);
    modal.strokeRoundedRect(width / 2 - modalW / 2, height / 2 - modalH / 2, modalW, modalH, 18);
    modal.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: modal, alpha: 1, scale: 1, duration: 250, ease: 'Back.Out' });

    const title = this.add.text(width / 2, height / 2 - modalH / 2 + 36, 'Como Jogar', {
      font: 'bold 22px Arial',
      color: '#1e88e5'
    }).setOrigin(0.5).setDepth(13).setAlpha(0);

    const text = this.add.text(width / 2, height / 2 + 12,
      '• Toque e arraste sobre o carro para dirigir.\n' +
      '• Desvie de carros e buracos.\n' +
      '• Colete os itens nas placas.\n' +
      '• Após coletar tudo, chegue no seu destino',
      {
        font: '16px Arial',
        color: '#2c3e50',
        align: 'center',
        wordWrap: { width: modalW - 40 }
      }
    ).setOrigin(0.5).setDepth(13).setAlpha(0);

    const btn = this.add.text(width / 2, height / 2 + modalH / 2 - 28, 'Fechar', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(13).setAlpha(0);
    const btnBg = this.add.graphics().setDepth(12.5);
    const btnW = 120, btnH = 42;
    btnBg.fillStyle(0x1e88e5, 1);
    btnBg.fillRoundedRect(width / 2 - btnW / 2, height / 2 + modalH / 2 - 28 - btnH / 2, btnW, btnH, 12);
    btnBg.setAlpha(0);

    this.tweens.add({ targets: [title, text, btn, btnBg], alpha: 1, duration: 250, delay: 120 });

    const close = () => {
      this.tweens.add({ targets: [title, text, btn, btnBg], alpha: 0, duration: 150 });
      this.tweens.add({
        targets: modal,
        alpha: 0,
        scale: 0.9,
        duration: 180,
        ease: 'Power2',
        onComplete: () => { overlay.destroy(); shadow.destroy(); modal.destroy(); title.destroy(); text.destroy(); btn.destroy(); btnBg.destroy(); }
      });
    };

    overlay.once('pointerdown', close);
    btn.setInteractive({ useHandCursor: true }).once('pointerdown', close);
  }

  private initializeAudio() {
    if (!this.backgroundMusic) {
      this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.5 });
    }
  }

  private startGame() {
    // Iniciar música e transição
    if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }

    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.registry.set('backgroundMusic', this.backgroundMusic);
      this.scene.start('Game');
    });
  }
}
