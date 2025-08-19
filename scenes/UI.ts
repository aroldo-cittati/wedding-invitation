// UI.ts - Cena de interface do usuário
export class UI extends Phaser.Scene {
  constructor() {
    super('UI');
  }
  create() {
    // HUD e overlays
    this.game.events.on('ui-checkpoint', (payload: { item: 'key' | 'map' | 'ticket' }) => {
      this.showCheckpointOverlay(payload.item);
    });
  }

  private showCheckpointOverlay(item: 'key' | 'map' | 'ticket') {
    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(100).setInteractive();
    const title = this.add.text(width / 2, height / 2 - 40, 'Checkpoint!', { font: '24px Arial', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(101);

    const msg = item === 'key'
      ? 'Você encontrou uma CHAVE!'
      : item === 'map'
      ? 'Você encontrou um MAPA!'
      : 'Você encontrou um INGRESSO!';

    const text = this.add.text(width / 2, height / 2, msg, { font: '18px Arial', color: '#ffffff', align: 'center', wordWrap: { width: width * 0.8 } })
      .setOrigin(0.5)
      .setDepth(101);

    // Ícone (se existir)
    const iconKey = item === 'key' ? 'iconKey' : item === 'map' ? 'iconMap' : 'iconTicket';
    const icon = this.add.image(width / 2, height / 2 + 50, iconKey).setOrigin(0.5).setDepth(101);
    if (icon.height) {
      const targetH = Math.round(height * 0.1);
      icon.setScale(targetH / icon.height);
    }

    const btn = this.add.text(width / 2, height / 2 + 120, 'OK', { font: '20px Arial', color: '#000000', backgroundColor: '#ffffff' })
      .setOrigin(0.5)
      .setPadding(10, 6, 10, 6)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });

    const close = () => {
      overlay.destroy();
      title.destroy();
      text.destroy();
      icon.destroy();
      btn.destroy();
      // Avisar Game para retomar
      this.game.events.emit('ui-checkpoint-closed');
    };

    overlay.once('pointerdown', close);
    btn.once('pointerdown', close);
  }
}
