// Boot.ts - Cena de boot do Phaser 3
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    // Carregue assets mínimos, se necessário
  }
  create() {
    this.scene.start('Preload');
  }
}
