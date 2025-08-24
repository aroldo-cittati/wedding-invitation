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

export interface ModalOptions {
  title: string;
  body: string;
  buttonText?: string;
  buttonHandler?: () => void;
  iconKey?: string;
  color?: string;
  emitOnClose?: string; // nome do evento a emitir quando o modal fechar
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
    const config = this.getItemConfig(item);
    this.showModal({
      title: `🎉 CHECKPOINT! 🎉`,
      body: config.message,
      buttonText: 'CONTINUAR',
      iconKey: config.iconKey,
      color: config.color,
      emitOnClose: 'ui-checkpoint-closed'
    });
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
      .fillStyle(0x000000, 0.5)
      .fillRoundedRect(width / 2 + 6 - modalWidth / 2, height / 2 + 6 - modalHeight / 2, modalWidth, modalHeight, borderRadius * 1.5)
      .setDepth(101);

    const modal = this.scene.add.graphics()
      .fillStyle(0xffffff, 1)
      .fillGradientStyle(0xffffff, 0xf0f0f0, 0xe0e0e0, 0xd0d0d0, 1)
      .lineStyle(4, 0x2c3e50)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius * 1.5)
      .strokeRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius * 1.5)
      .setDepth(102);

    return { shadow: modalShadow, modal };
  }

  // createCheckpointContent removido — uso da versão genérica showModal agora

  // createContinueButton removido — usar createActionButton para ações customizáveis

  /**
   * Versão genérica do botão do modal. Recebe texto e um handler opcional.
   */
  private createActionButton(width: number, height: number, modalHeight: number, buttonTextStr: string, handler?: () => void) {
    const buttonWidth = 180;
    const buttonHeight = 55;
    const buttonY = height / 2 + modalHeight / 2 - 50;

    const buttonShadow = this.scene.add.graphics()
      .fillStyle(0x000000, 0.3)
      .fillRoundedRect(width / 2 - buttonWidth / 2 + 3, buttonY - buttonHeight / 2 + 3, buttonWidth, buttonHeight, 10)
      .setDepth(103)
      .setAlpha(0);

    const buttonGraphics = this.scene.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x2ecc71)
      .setOrigin(0.5)
      .setDepth(104)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const buttonText = this.scene.add.text(width / 2, buttonY, buttonTextStr || 'OK',
      { font: 'bold 20px Arial', color: '#ffffff', shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2 } })
      .setOrigin(0.5)
      .setDepth(105)
      .setAlpha(0);

    return { shadow: buttonShadow, graphics: buttonGraphics, text: buttonText, handler };
  }

  /**
   * Abre um modal genérico. Conteúdo: título, body, texto do botão e função do botão.
   */
  public showModal(options: ModalOptions): void {
    const { width, height } = this.scene.cameras.main;

    const overlay = this.createOverlay(width, height);
    const modal = this.createModal(width, height);
    const elements = this.createGenericContent(width, height, options);

    this.animateModal(overlay, modal, elements, options.emitOnClose);
  }

  private createGenericContent(width: number, height: number, options: ModalOptions) {
    const modalWidth = Math.min(width * 0.85, this.config.modalMaxWidth);
    const modalHeight = Math.min(height * 0.65, this.config.modalMaxHeight);
    const headerHeight = 60;

    const header = this.scene.add.graphics()
      .fillStyle(options.color ? parseInt(options.color.replace('#', ''), 16) : 0x3498db, 1)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, headerHeight, { tl: this.config.borderRadius, tr: this.config.borderRadius, bl: 0, br: 0 })
      .setDepth(103)
      .setAlpha(0);

    const title = this.scene.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight / 2, options.title,
      { font: 'bold 22px Arial', color: '#ffffff', align: 'center' })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    let icon: Phaser.GameObjects.Image | null = null;
    if (options.iconKey) {
      icon = this.scene.add.image(width / 2, height / 2 - 60, options.iconKey)
        .setOrigin(0.5)
        .setDepth(104)
        .setAlpha(0);

      if (icon.height) {
        const targetSize = Math.round(height * 0.12);
        icon.setScale(targetSize / icon.height);
      }
    }

    const itemTitle = this.scene.add.text(width / 2, height / 2 - 5, '',
      { font: 'bold 20px Arial', color: options.color || '#2c3e50', align: 'center' })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    const description = this.scene.add.text(width / 2, height / 2 + 40, options.body,
      { font: '16px Arial', color: '#2c3e50', align: 'center', wordWrap: { width: modalWidth - 40 } })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    const button = this.createActionButton(width, height, modalHeight, options.buttonText || 'OK', options.buttonHandler);

    return { header, title, icon, itemTitle, description, button };
  }

  private animateModal(overlay: Phaser.GameObjects.Rectangle, modal: any, elements: any, emitOnClose?: string): void {
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

    // Setup do fechamento — usa evento customizável
    this.setupModalCloseGeneric(overlay, modal, elements, emitOnClose);
  }

  private setupModalCloseGeneric(overlay: Phaser.GameObjects.Rectangle, modal: any, elements: any, emitOnClose?: string): void {
    const allElements = [
      overlay, modal.shadow, modal.modal, elements.header, elements.title,
      elements.icon, elements.itemTitle, elements.description,
      elements.button.graphics, elements.button.text
    ];

    const closeModal = (fromButton = false) => {
      // Se veio do botão, invoca handler antes de fechar
      try {
        if (fromButton && elements.button && typeof elements.button.handler === 'function') {
          elements.button.handler();
        }
      } catch (e) {
        // ignorar erros do handler
      }

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
              if (emitOnClose) this.scene.game.events.emit(emitOnClose);
            }
          });
        }
      });
    };

    overlay.once('pointerdown', () => closeModal(false));
    elements.button.graphics.once('pointerdown', () => closeModal(true));
  }

  // animateCheckpointModal removido — usa animateModal genérico

  private animateCheckpointContent(elements: any): void {
    // Header e título
    this.scene.tweens.add({
      targets: [elements.header, elements.title],
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Ícone com rotação e bounce
    this.scene.tweens.add({
      targets: elements.icon,
      alpha: 1,
      rotation: 2 * Math.PI,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 600,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: elements.icon,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
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

    // Botão com bounce
    this.scene.tweens.add({
      targets: [elements.button.graphics, elements.button.text],
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 400,
      delay: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [elements.button.graphics, elements.button.text],
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    });
  }

  // setupModalClose removido — usa setupModalCloseGeneric

  private getItemConfig(item: InventoryItem): ItemConfig {
    const configs: Record<InventoryItem, ItemConfig> = {
      item1: {
        title: 'ELIZANGELA ENCONTRADA!',
        message: 'Você encontrou a Elizangela na estrada!\nEla precisa de uma carona para um evento especial.',
        color: '#f39c12',
        iconKey: 'item1_icon'
      },
      item2: {
        title: 'AROLDO DESCOBERTO!',
        message: 'Você encontrou o Aroldo esperando!\nEle também precisa de uma carona para o mesmo lugar.',
        color: '#27ae60',
        iconKey: 'item2_icon'
      },
      item3: {
        title: 'INGRESSO ENCONTRADO!',
        message: 'Você encontrou um ingresso especial para o evento!\nEste ingresso é necessário para a entrada.',
        color: '#e74c3c',
        iconKey: 'item3_icon'
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

    const subtitle = this.scene.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight + 50, 
      'Parabéns! Você trouxe Aroldo e Elizangela. \n O ingresso encontrado dará acesso a um grande evento que acontecerá em breve.',
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
