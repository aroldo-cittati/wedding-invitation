// UI.ts - Cena de interface do usuário
import { INVITE } from '../config/invite';

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

    // Evento para mostrar o convite final
    this.game.events.on('ui-invite', () => {
      this.showInviteOverlay();
    });
  }

  private showCheckpointOverlay(item: 'key' | 'map' | 'ticket') {
    const { width, height } = this.cameras.main;
    
    // Overlay de fundo
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(100)
      .setInteractive()
      .setAlpha(0);
    
    // Animação de fade in do overlay
    this.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 300,
      ease: 'Power2'
    });

    // Dimensões do modal
    const modalWidth = Math.min(width * 0.85, 350);
    const modalHeight = Math.min(height * 0.65, 420);
    const borderRadius = 20;
    
    // Sombra do modal (com bordas arredondadas)
    const modalShadow = this.add.graphics()
      .fillStyle(0x000000, 0.3)
      .fillRoundedRect(width / 2 + 4 - modalWidth / 2, height / 2 + 4 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(101);

    // Modal principal (com bordas arredondadas)
    const modal = this.add.graphics()
      .fillStyle(0xffffff, 1)
      .lineStyle(3, 0x2c3e50)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .strokeRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(102);

    // Header colorido (inicialmente invisível, com bordas arredondadas apenas no topo)
    const headerHeight = 60;
    const header = this.add.graphics()
      .fillStyle(0x3498db, 1)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, headerHeight, { tl: borderRadius, tr: borderRadius, bl: 0, br: 0 })
      .setDepth(103)
      .setAlpha(0);

    // Título principal (inicialmente invisível)
    const title = this.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight / 2, '🎉 CHECKPOINT! 🎉', 
      { 
        font: 'bold 22px Arial', 
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    // Animação de entrada do modal
    modal.setScale(0.1);
    modalShadow.setScale(0.1);
    this.tweens.add({
      targets: [modal, modalShadow],
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Configurações específicas por item
    const itemConfigs = {
      key: {
        title: 'CHAVE ENCONTRADA!',
        message: 'Você encontrou a chave mágica!\nEla será útil no final da jornada.',
        color: '#f39c12',
        iconKey: 'iconKey'
      },
      map: {
        title: 'MAPA DESCOBERTO!',
        message: 'Um mapa antigo foi revelado!\nEle mostra o caminho para o destino.',
        color: '#27ae60',
        iconKey: 'iconMap'
      },
      ticket: {
        title: 'INGRESSO OBTIDO!',
        message: 'Você conquistou o ingresso especial!\nAgora você tem tudo que precisa!',
        color: '#e74c3c',
        iconKey: 'iconTicket'
      }
    };

    const config = itemConfigs[item];

    // Ícone do item com animação (inicialmente invisível)
    const icon = this.add.image(width / 2, height / 2 - 60, config.iconKey)
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);
    
    if (icon.height) {
      const targetSize = Math.round(height * 0.12);
      icon.setScale(targetSize / icon.height);
    }

    // Título do item coletado (inicialmente invisível)
    const itemTitle = this.add.text(width / 2, height / 2 - 5, config.title, 
      { 
        font: 'bold 20px Arial', 
        color: config.color,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    // Mensagem descritiva (inicialmente invisível)
    const description = this.add.text(width / 2, height / 2 + 40, config.message, 
      { 
        font: '16px Arial', 
        color: '#2c3e50',
        align: 'center',
        wordWrap: { width: modalWidth - 40 }
      })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    // Botão para continuar (inicialmente invisível)
    const buttonWidth = 160;
    const buttonHeight = 50;
    const buttonY = height / 2 + modalHeight / 2 - 40;

    const button = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x2ecc71, 1)
      .setOrigin(0.5)
      .setDepth(104)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x27ae60)
      .setAlpha(0);

    const buttonText = this.add.text(width / 2, buttonY, 'CONTINUAR', 
      { 
        font: 'bold 18px Arial', 
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(105)
      .setAlpha(0);

    // Animação dos conteúdos após o modal abrir (com delay)
    this.time.delayedCall(450, () => {
      // Fade in do header e título
      this.tweens.add({
        targets: [header, title],
        alpha: 1,
        duration: 300,
        ease: 'Power2'
      });

      // Fade in e rotação do ícone
      this.tweens.add({
        targets: icon,
        alpha: 1,
        rotation: 2 * Math.PI,
        duration: 600,
        ease: 'Power2'
      });

      // Fade in do título do item com delay
      this.tweens.add({
        targets: itemTitle,
        alpha: 1,
        duration: 300,
        delay: 200,
        ease: 'Power2'
      });

      // Fade in da descrição com delay
      this.tweens.add({
        targets: description,
        alpha: 1,
        duration: 300,
        delay: 300,
        ease: 'Power2'
      });

      // Fade in do botão com delay
      this.tweens.add({
        targets: [button, buttonText],
        alpha: 1,
        duration: 300,
        delay: 400,
        ease: 'Power2'
      });
    });

    // Efeitos interativos do botão
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2'
      });
      button.setFillStyle(0x27ae60);
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2'
      });
      button.setFillStyle(0x2ecc71);
    });

    // Todos os elementos do modal
    const allElements = [overlay, modalShadow, modal, header, title, icon, itemTitle, description, button, buttonText];

    const closeModal = () => {
      // Primeiro fade out dos conteúdos
      this.tweens.add({
        targets: [header, title, icon, itemTitle, description, button, buttonText],
        alpha: 0,
        duration: 200,
        ease: 'Power2.easeIn',
        onComplete: () => {
          // Depois animação de saída do modal
          this.tweens.add({
            targets: [modal, modalShadow],
            scaleX: 0.1,
            scaleY: 0.1,
            duration: 300,
            ease: 'Power2.easeIn'
          });

          this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              // Limpar todos os elementos
              allElements.forEach(element => element.destroy());
              // Avisar o jogo para continuar
              this.game.events.emit('ui-checkpoint-closed');
            }
          });
        }
      });
    };

    // Eventos de fechamento
    overlay.once('pointerdown', closeModal);
    button.once('pointerdown', closeModal);
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

  private showInviteOverlay() {
    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(200).setInteractive();

    const title = this.add.text(width / 2, height * 0.22, `${INVITE.coupleNames}`, { font: '26px Arial', color: '#ffffff' })
      .setOrigin(0.5).setDepth(201);

    const subtitle = this.add.text(width / 2, height * 0.29, 'Você usou a chave, o mapa e o ingresso e desbloqueou o casamento!',
      { font: '16px Arial', color: '#ffffff', align: 'center', wordWrap: { width: width * 0.9 } })
      .setOrigin(0.5).setDepth(201);

    const date = this.add.text(width / 2, height * 0.39, `Data: ${INVITE.date}`, { font: '18px Arial', color: '#ffffff' })
      .setOrigin(0.5).setDepth(201);
    const time = this.add.text(width / 2, height * 0.45, `Horário: ${INVITE.time}`, { font: '18px Arial', color: '#ffffff' })
      .setOrigin(0.5).setDepth(201);
    const addr = this.add.text(width / 2, height * 0.53, `${INVITE.addressText}`,
      { font: '16px Arial', color: '#ffffff', align: 'center', wordWrap: { width: width * 0.88 } })
      .setOrigin(0.5).setDepth(201);

    // Botões
  const btnMaps = this.add.text(width / 2, height * 0.66, 'Abrir o Convite',
      { font: '20px Arial', color: '#000000', backgroundColor: '#ffffff' })
      .setOrigin(0.5).setPadding(12, 8, 12, 8).setDepth(201).setInteractive({ useHandCursor: true });

    const btnReplay = this.add.text(width / 2, height * 0.75, 'Jogar de novo',
      { font: '20px Arial', color: '#000000', backgroundColor: '#ffffff' })
      .setOrigin(0.5).setPadding(12, 8, 12, 8).setDepth(201).setInteractive({ useHandCursor: true });

    const cleanup = () => {
      overlay.destroy();
      title.destroy();
      subtitle.destroy();
      date.destroy();
      time.destroy();
      addr.destroy();
      btnMaps.destroy();
      btnReplay.destroy();
    };

    btnMaps.on('pointerup', (_pointer: any, _localX: any, _localY: any, event: any) => {
      if (event && event.stopPropagation) event.stopPropagation();
      if (!INVITE.inviteUrl) return;
      const win = window.open(INVITE.inviteUrl, '_blank');
      // Fallback caso o navegador bloqueie popups
      if (!win) {
        window.location.href = INVITE.inviteUrl;
      }
    });

    btnReplay.on('pointerdown', () => {
      cleanup();
      this.game.events.emit('ui-restart');
    });
  }
}
