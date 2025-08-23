import type { InventoryItem } from './InventoryManager';

export interface OverlayConfig {
  modalMaxWidth: number;
  modalMaxHeight: number;
  borderRadius: number;
  animationDuration: number;
}

export interface ItemConfig {
  title: string;
  message: string;
  color: string;
  iconKey: string;
}

export class OverlayManager {
  private scene: Phaser.Scene;
  private config: OverlayConfig;

  constructor(scene: Phaser.Scene, config?: Partial<OverlayConfig>) {
    this.scene = scene;
    this.config = {
      modalMaxWidth: 350,
      modalMaxHeight: 420,
      borderRadius: 20,
      animationDuration: 400,
      ...config
    };
  }

  showCheckpointOverlay(item: InventoryItem): void {
    const { width, height } = this.scene.cameras.main;
    
    const overlay = this.createOverlay(width, height);
    const modal = this.createModal(width, height);
    const elements = this.createCheckpointContent(width, height, item);
    
    this.animateCheckpointModal(overlay, modal, elements);
  }

  private createOverlay(width: number, height: number): Phaser.GameObjects.Rectangle {
    return this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(100)
      .setInteractive()
      .setAlpha(0);
  }

  private createModal(width: number, height: number): { shadow: Phaser.GameObjects.Graphics; modal: Phaser.GameObjects.Graphics } {
    const modalWidth = Math.min(width * 0.85, this.config.modalMaxWidth);
    const modalHeight = Math.min(height * 0.65, this.config.modalMaxHeight);
    const { borderRadius } = this.config;
    
    const modalShadow = this.scene.add.graphics()
      .fillStyle(0x000000, 0.3)
      .fillRoundedRect(width / 2 + 4 - modalWidth / 2, height / 2 + 4 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(101);

    const modal = this.scene.add.graphics()
      .fillStyle(0xffffff, 1)
      .lineStyle(3, 0x2c3e50)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .strokeRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(102);

    return { shadow: modalShadow, modal };
  }

  private createCheckpointContent(width: number, height: number, item: InventoryItem) {
    const modalWidth = Math.min(width * 0.85, this.config.modalMaxWidth);
    const modalHeight = Math.min(height * 0.65, this.config.modalMaxHeight);
    const headerHeight = 60;
    
    const header = this.scene.add.graphics()
      .fillStyle(0x3498db, 1)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, headerHeight, { tl: this.config.borderRadius, tr: this.config.borderRadius, bl: 0, br: 0 })
      .setDepth(103)
      .setAlpha(0);

    const title = this.scene.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight / 2, '🎉 CHECKPOINT! 🎉', 
      { font: 'bold 22px Arial', color: '#ffffff', align: 'center' })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    const config = this.getItemConfig(item);
    
    const icon = this.scene.add.image(width / 2, height / 2 - 60, config.iconKey)
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);
    
    if (icon.height) {
      const targetSize = Math.round(height * 0.12);
      icon.setScale(targetSize / icon.height);
    }

    const itemTitle = this.scene.add.text(width / 2, height / 2 - 5, config.title, 
      { font: 'bold 20px Arial', color: config.color, align: 'center' })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    const description = this.scene.add.text(width / 2, height / 2 + 40, config.message, 
      { font: '16px Arial', color: '#2c3e50', align: 'center', wordWrap: { width: modalWidth - 40 } })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    const button = this.createContinueButton(width, height, modalHeight);

    return { header, title, icon, itemTitle, description, button };
  }

  private createContinueButton(width: number, height: number, modalHeight: number) {
    const buttonWidth = 160;
    const buttonHeight = 50;
    const buttonY = height / 2 + modalHeight / 2 - 40;

    const buttonGraphics = this.scene.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x2ecc71, 1)
      .setOrigin(0.5)
      .setDepth(104)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x27ae60)
      .setAlpha(0);

    const buttonText = this.scene.add.text(width / 2, buttonY, 'CONTINUAR', 
      { font: 'bold 18px Arial', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(105)
      .setAlpha(0);

    this.setupButtonEffects(buttonGraphics);

    return { graphics: buttonGraphics, text: buttonText };
  }

  private setupButtonEffects(button: Phaser.GameObjects.Rectangle): void {
    button.on('pointerover', () => {
      this.scene.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2'
      });
      button.setFillStyle(0x27ae60);
    });

    button.on('pointerout', () => {
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2'
      });
      button.setFillStyle(0x2ecc71);
    });
  }

  private animateCheckpointModal(overlay: Phaser.GameObjects.Rectangle, modal: any, elements: any): void {
    // Fade in do overlay
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 300,
      ease: 'Power2'
    });

    // Animação de entrada do modal
    modal.modal.setScale(0.1);
    modal.shadow.setScale(0.1);
    this.scene.tweens.add({
      targets: [modal.modal, modal.shadow],
      scaleX: 1,
      scaleY: 1,
      duration: this.config.animationDuration,
      ease: 'Back.easeOut'
    });

    // Animação dos conteúdos
    this.scene.time.delayedCall(450, () => {
      this.animateCheckpointContent(elements);
    });

    // Setup do fechamento
    this.setupModalClose(overlay, modal, elements);
  }

  private animateCheckpointContent(elements: any): void {
    // Header e título
    this.scene.tweens.add({
      targets: [elements.header, elements.title],
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Ícone com rotação
    this.scene.tweens.add({
      targets: elements.icon,
      alpha: 1,
      rotation: 2 * Math.PI,
      duration: 600,
      ease: 'Power2'
    });

    // Título do item
    this.scene.tweens.add({
      targets: elements.itemTitle,
      alpha: 1,
      duration: 300,
      delay: 200,
      ease: 'Power2'
    });

    // Descrição
    this.scene.tweens.add({
      targets: elements.description,
      alpha: 1,
      duration: 300,
      delay: 300,
      ease: 'Power2'
    });

    // Botão
    this.scene.tweens.add({
      targets: [elements.button.graphics, elements.button.text],
      alpha: 1,
      duration: 300,
      delay: 400,
      ease: 'Power2'
    });
  }

  private setupModalClose(overlay: Phaser.GameObjects.Rectangle, modal: any, elements: any): void {
    const allElements = [
      overlay, modal.shadow, modal.modal, elements.header, elements.title,
      elements.icon, elements.itemTitle, elements.description,
      elements.button.graphics, elements.button.text
    ];

    const closeModal = () => {
      this.scene.tweens.add({
        targets: [elements.header, elements.title, elements.icon, elements.itemTitle, elements.description, elements.button.graphics, elements.button.text],
        alpha: 0,
        duration: 200,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.scene.tweens.add({
            targets: [modal.modal, modal.shadow],
            scaleX: 0.1,
            scaleY: 0.1,
            duration: 300,
            ease: 'Power2.easeIn'
          });

          this.scene.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              allElements.forEach(element => element.destroy());
              this.scene.game.events.emit('ui-checkpoint-closed');
            }
          });
        }
      });
    };

    overlay.once('pointerdown', closeModal);
    elements.button.graphics.once('pointerdown', closeModal);
  }

  private getItemConfig(item: InventoryItem): ItemConfig {
    const configs: Record<InventoryItem, ItemConfig> = {
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

    return configs[item];
  }

  showInviteOverlay(inviteData: any): void {
    const { width, height } = this.scene.cameras.main;
    
    const overlay = this.createOverlay(width, height);
    const modal = this.createInviteModal(width, height);
    const elements = this.createInviteContent(width, height, inviteData);
    
    this.animateInviteModal(overlay, modal, elements);
  }

  private createInviteModal(width: number, height: number) {
    const modalWidth = Math.min(width * 0.9, 400);
    const modalHeight = Math.min(height * 0.85, 500);
    const borderRadius = 25;
    
    const modalShadow = this.scene.add.graphics()
      .fillStyle(0x000000, 0.4)
      .fillRoundedRect(width / 2 + 6 - modalWidth / 2, height / 2 + 6 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(201);

    const modal = this.scene.add.graphics()
      .fillStyle(0xffffff, 1)
      .lineStyle(4, 0x8e44ad)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .strokeRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(202);

    return { shadow: modalShadow, modal, width: modalWidth, height: modalHeight };
  }

  private createInviteContent(width: number, height: number, inviteData: any) {
    const modalWidth = Math.min(width * 0.9, 400);
    const modalHeight = Math.min(height * 0.85, 500);
    const headerHeight = 80;
    
    const header = this.scene.add.graphics()
      .fillStyle(0x8e44ad, 1)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, headerHeight, { tl: 25, tr: 25, bl: 0, br: 0 })
      .setDepth(203)
      .setAlpha(0);

    const title = this.scene.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight / 2, `💒 ${inviteData.coupleNames} 💒`, 
      { font: 'bold 24px Arial', color: '#ffffff', align: 'center' })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    const subtitle = this.scene.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight + 30, 
      'Você usou a chave, o mapa e o ingresso e desbloqueou o casamento!',
      { font: '16px Arial', color: '#2c3e50', align: 'center', wordWrap: { width: modalWidth - 40 } })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    const date = this.scene.add.text(width / 2, height / 2 - 60, `📅 Data: ${inviteData.date}`, 
      { font: 'bold 18px Arial', color: '#8e44ad' })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    const time = this.scene.add.text(width / 2, height / 2 - 25, `🕐 Horário: ${inviteData.time}`, 
      { font: 'bold 18px Arial', color: '#8e44ad' })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    const addr = this.scene.add.text(width / 2, height / 2 + 20, `📍 ${inviteData.addressText}`,
      { font: '16px Arial', color: '#2c3e50', align: 'center', wordWrap: { width: modalWidth - 40 } })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    const button = this.createInviteButton(width, height, modalHeight, inviteData.inviteUrl);

    return { header, title, subtitle, date, time, addr, button };
  }

  private createInviteButton(width: number, height: number, modalHeight: number, inviteUrl: string) {
    const btnWidth = 200;
    const btnHeight = 50;
    const btnY = height / 2 + modalHeight / 2 - 70;

    const btnGraphics = this.scene.add.graphics()
      .fillStyle(0x8e44ad, 1)
      .lineStyle(2, 0x7d3c98)
      .fillRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
      .strokeRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
      .setDepth(204)
      .setAlpha(0);

    const btnClickArea = this.scene.add.rectangle(width / 2, btnY, btnWidth, btnHeight, 0x000000, 0)
      .setDepth(206)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const btnText = this.scene.add.text(width / 2, btnY, 'Abrir Convite', 
      { font: 'bold 18px Arial', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(205)
      .setAlpha(0);

    this.setupInviteButtonEffects(btnClickArea, btnGraphics, btnWidth, btnHeight, btnY, width, inviteUrl);

    return { graphics: btnGraphics, clickArea: btnClickArea, text: btnText };
  }

  private setupInviteButtonEffects(clickArea: Phaser.GameObjects.Rectangle, graphics: Phaser.GameObjects.Graphics, btnWidth: number, btnHeight: number, btnY: number, width: number, inviteUrl: string): void {
    clickArea.on('pointerover', () => {
      this.scene.tweens.add({
        targets: clickArea,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2'
      });
      graphics.clear()
        .fillStyle(0x7d3c98, 1)
        .lineStyle(2, 0x6c2d7f)
        .fillRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
        .strokeRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15);
    });

    clickArea.on('pointerout', () => {
      this.scene.tweens.add({
        targets: clickArea,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2'
      });
      graphics.clear()
        .fillStyle(0x8e44ad, 1)
        .lineStyle(2, 0x7d3c98)
        .fillRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
        .strokeRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15);
    });

  // Use pointerup to improve compatibility with iOS/Safari touch activation
  clickArea.on('pointerup', () => {
      if (!inviteUrl) return;

      // Tenta abrir em nova aba/janela. Usa noopener/noreferrer para melhorar a segurança
      // e aumentar a probabilidade do navegador tratar como ação do usuário.
      try {
        const win = window.open(inviteUrl, '_blank', 'noopener,noreferrer');
        if (win && typeof (win as Window).focus === 'function') {
          (win as Window).focus();
          return;
        }
      } catch (e) {
        // ignore and continue to fallbacks
      }

      // Fallback: criar um elemento <a> e acioná-lo programaticamente. Alguns navegadores
      // aceitam isso quando o window.open é bloqueado.
      try {
        const a = document.createElement('a');
        a.href = inviteUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        // Anexa ao body pois alguns navegadores exigem que o elemento esteja no DOM
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      } catch (e) {
        // fallback final: navegar na mesma janela
      }

      window.location.href = inviteUrl;
    });
  }

  private animateInviteModal(overlay: Phaser.GameObjects.Rectangle, modal: any, elements: any): void {
    // Fade in do overlay
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 300,
      ease: 'Power2'
    });

    // Animação de entrada do modal
    modal.modal.setScale(0.1);
    modal.shadow.setScale(0.1);
    this.scene.tweens.add({
      targets: [modal.modal, modal.shadow],
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Animação dos conteúdos
    this.scene.time.delayedCall(550, () => {
      this.animateInviteContent(elements);
    });
  }

  private animateInviteContent(elements: any): void {
    const delays = [0, 200, 400, 500, 600, 800];
    const targets = [
      [elements.header, elements.title],
      [elements.subtitle],
      [elements.date],
      [elements.time],
      [elements.addr],
      [elements.button.graphics, elements.button.text, elements.button.clickArea]
    ];

    targets.forEach((target, index) => {
      this.scene.tweens.add({
        targets: target,
        alpha: 1,
        duration: 300,
        delay: delays[index],
        ease: 'Power2'
      });
    });
  }
}
