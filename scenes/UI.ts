// UI.ts - Cena de interface do usuário
export class UI extends Phaser.Scene {
  private icons!: { key: Phaser.GameObjects.Image; map: Phaser.GameObjects.Image; ticket: Phaser.GameObjects.Image };
  private inventory = { key: false, map: false, ticket: false };
  private livesText!: Phaser.GameObjects.Text;
  private maxLives: number = 5;
  private hits: number = 0;
  constructor() {
    super('UI');
  }
  create() {
    // HUD fixo no topo (ícones de inventário)
    const { width, height } = this.cameras.main;
    const margin = 10;
    const gap = 8;
    const targetH = Math.round(height * 0.06);

    const iconY = margin + targetH / 2;
    const keyX = margin + targetH / 2;
    const mapX = keyX + targetH + gap;
    const ticketX = mapX + targetH + gap;

    const keyIcon = this.add.image(keyX, iconY, 'iconKey').setOrigin(0.5).setScrollFactor(0).setDepth(100);
    const mapIcon = this.add.image(mapX, iconY, 'iconMap').setOrigin(0.5).setScrollFactor(0).setDepth(100);
    const ticketIcon = this.add.image(ticketX, iconY, 'iconTicket').setOrigin(0.5).setScrollFactor(0).setDepth(100);
    if (keyIcon.height) keyIcon.setScale(targetH / keyIcon.height);
    if (mapIcon.height) mapIcon.setScale(targetH / mapIcon.height);
    if (ticketIcon.height) ticketIcon.setScale(targetH / ticketIcon.height);

    this.icons = { key: keyIcon, map: mapIcon, ticket: ticketIcon };
    this.applyInventoryTint();

    // Overlays e eventos do Game
    this.game.events.on('ui-checkpoint', (payload: { item: 'key' | 'map' | 'ticket' }) => {
      // Atualiza inventário e HUD imediatamente
      this.inventory[payload.item] = true;
      this.applyInventoryTint();
      this.showCheckpointOverlay(payload.item);
    });

    // Reset inventário quando o Game reiniciar
    this.game.events.on('ui-reset-inventory', () => {
      this.inventory = { key: false, map: false, ticket: false };
      this.applyInventoryTint();
    });

    // HUD de vidas (embaixo dos ícones de inventário)
    this.livesText = this.add.text(
      margin,
      iconY + targetH / 2 + 6,
      '',
      { font: '16px Arial', color: '#ffffff' }
    ).setDepth(100).setScrollFactor(0);
  this.updateLivesHUD();

    // Receber atualizações de vidas do Game
    this.game.events.on('ui-lives', (payload: { maxLives: number; hits: number }) => {
      this.maxLives = payload.maxLives;
      this.hits = payload.hits;
      this.updateLivesHUD();
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

  private applyInventoryTint() {
    const onTint = 0xffffff;
    const offTint = 0x3a3a3a; // mais escuro para maior contraste
    const onAlpha = 1.0;
    const offAlpha = 0.35; // reduz opacidade quando não coletado

    this.icons.key.setTint(this.inventory.key ? onTint : offTint).setAlpha(this.inventory.key ? onAlpha : offAlpha);
    this.icons.map.setTint(this.inventory.map ? onTint : offTint).setAlpha(this.inventory.map ? onAlpha : offAlpha);
    this.icons.ticket.setTint(this.inventory.ticket ? onTint : offTint).setAlpha(this.inventory.ticket ? onAlpha : offAlpha);
  }

  private updateLivesHUD() {
    const livesLeft = Math.max(0, this.maxLives - this.hits);
    const full = '❤️'.repeat(livesLeft);
    const empty = '🤍'.repeat(this.maxLives - livesLeft);
    this.livesText.setText(`Vidas: ${full}${empty}`);
  }
}
