// Preload.ts - Cena de preload do Phaser 3
export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }
  preload() {
    // Carregue assets aqui
  }
  create() {
    this.scene.start('Game');
  }
}
