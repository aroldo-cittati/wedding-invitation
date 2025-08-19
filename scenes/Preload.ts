// Preload.ts - Cena de preload do Phaser 3
export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }
  preload() {
    // Barra de progresso
    const { width, height } = this.cameras.main;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 110, height / 2 - 20, 220, 40);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Carregando...', {
      font: '18px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 100, height / 2 - 10, 200 * value, 20);
    });
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Carregar assets reais da pasta assets
    this.load.image('road', 'assets/road.png');
    this.load.image('carPlayer', 'assets/carPlayer.png');
    this.load.image('carEnemy1', 'assets/carEnemy1.png');
    this.load.image('carEnemy2', 'assets/carEnemy2.png');
    this.load.image('pothole', 'assets/pothole.png');
    this.load.image('checkpointSign', 'assets/checkpointSign.png');
    this.load.image('houseGoal', 'assets/houseGoal.png');
    this.load.image('iconKey', 'assets/iconKey.png');
    this.load.image('iconMap', 'assets/iconMap.png');
    this.load.image('iconTicket', 'assets/iconTicket.png');
  }

  create() {
    this.scene.start('Game');
  }

  // ...
}
