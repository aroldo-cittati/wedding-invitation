// UI.ts - Cena de interface do usuário
import { INVITE } from '../config/invite';

export class UI extends Phaser.Scene {
  private icons!: { key: Phaser.GameObjects.Image; map: Phaser.GameObjects.Image; ticket: Phaser.GameObjects.Image };
  private inventory = { key: false, map: false, ticket: false };
  private livesText!: Phaser.GameObjects.Text;
  private maxLives: number = 5;
  private hits: number = 0;
  private hudContainer!: Phaser.GameObjects.Container;
  private hudBackground!: Phaser.GameObjects.Graphics;
  private iconOriginalScales!: { key: number; map: number; ticket: number };
  private soundButton!: Phaser.GameObjects.Text;
  private musicEnabled: boolean = true;

  constructor() {
    super('UI');
  }
  create() {
    const { width, height } = this.cameras.main;
    
    // Limpar eventos anteriores para evitar duplicação
    this.game.events.off('ui-checkpoint');
    this.game.events.off('ui-reset-inventory');
    this.game.events.off('ui-lives');
    this.game.events.off('ui-invite');
    
    // Criar HUD moderna com fundo arredondado
    this.createModernHUD(width, height);

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

  destroy() {
    // Limpar todos os eventos quando a cena for destruída
    this.game.events.off('ui-checkpoint');
    this.game.events.off('ui-reset-inventory');
    this.game.events.off('ui-lives');
    this.game.events.off('ui-invite');
    this.game.events.off('ui-checkpoint-closed');
    this.game.events.off('ui-restart');
  }

  private createModernHUD(_width: number, height: number) {
    // Dimensões da HUD
    const margin = 12;
    const hudPadding = 8;
    const iconSize = Math.round(height * 0.05);
    const gap = 6;
    
    // Calcular tamanho total da HUD
    const hudWidth = (iconSize * 3) + (gap * 2) + (hudPadding * 2);
    const hudHeight = iconSize + 32 + (hudPadding * 2); // espaço para ícones + texto de vidas
    
    // Container principal da HUD
    this.hudContainer = this.add.container(margin + hudWidth / 2, margin + hudHeight / 2);
    this.hudContainer.setDepth(100).setScrollFactor(0);
    
    // Fundo da HUD com bordas arredondadas e efeito glassmorphism
    this.hudBackground = this.add.graphics();
    this.hudBackground.fillStyle(0x000000, 0.4);
    this.hudBackground.fillRoundedRect(-hudWidth / 2, -hudHeight / 2, hudWidth, hudHeight, 8);
    this.hudBackground.lineStyle(1, 0xffffff, 0.3);
    this.hudBackground.strokeRoundedRect(-hudWidth / 2, -hudHeight / 2, hudWidth, hudHeight, 8);
    
    // Adicionar fundo ao container
    this.hudContainer.add(this.hudBackground);
    
    // Posições dos ícones dentro do container
    const startX = -hudWidth / 2 + hudPadding + iconSize / 2;
    const iconsY = -hudHeight / 2 + hudPadding + iconSize / 2;
    
    const keyX = startX;
    const mapX = startX + iconSize + gap;
    const ticketX = startX + (iconSize + gap) * 2;

    // Criar ícones com efeitos visuais melhorados
    const keyIcon = this.add.image(keyX, iconsY, 'iconKey').setOrigin(0.5);
    const mapIcon = this.add.image(mapX, iconsY, 'iconMap').setOrigin(0.5);
    const ticketIcon = this.add.image(ticketX, iconsY, 'iconTicket').setOrigin(0.5);
    
    // Escalar ícones e armazenar escalas originais
    const keyScale = iconSize / keyIcon.height;
    const mapScale = iconSize / mapIcon.height;
    const ticketScale = iconSize / ticketIcon.height;
    
    keyIcon.setScale(keyScale);
    mapIcon.setScale(mapScale);
    ticketIcon.setScale(ticketScale);
    
    // Armazenar escalas originais para manter consistência
    this.iconOriginalScales = { 
      key: keyScale, 
      map: mapScale, 
      ticket: ticketScale 
    };
    
    // Adicionar efeito de brilho sutil aos ícones
    keyIcon.setTint(0xffffff);
    mapIcon.setTint(0xffffff);
    ticketIcon.setTint(0xffffff);
    
    // Adicionar ícones ao container
    this.hudContainer.add([keyIcon, mapIcon, ticketIcon]);

    this.icons = { key: keyIcon, map: mapIcon, ticket: ticketIcon };
    this.applyInventoryTint();

    // Texto de vidas com estilo melhorado - mais espaçamento
    this.livesText = this.add.text(
      0,
      iconsY + iconSize / 2 + 18,
      '',
      { 
        font: 'bold 12px Arial', 
        color: '#ffffff',
        align: 'center',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
      }
    ).setOrigin(0.5);
    
    this.hudContainer.add(this.livesText);
    this.updateLivesHUD();
    
    // Adicionar botão de som no canto superior direito
    this.createSoundButton();
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
    // Estados visuais dos itens
    const collectedTint = 0xffffff;    // Branco brilhante para coletados
    const collectedAlpha = 1.0;        // Totalmente opaco
    const unCollectedTint = 0x666666;  // Cinza escuro para não coletados
    const unCollectedAlpha = 0.4;      // Transparente
    
    // Aplicar estados visuais com animações
    this.updateIconState(this.icons.key, this.inventory.key, collectedTint, collectedAlpha, unCollectedTint, unCollectedAlpha);
    this.updateIconState(this.icons.map, this.inventory.map, collectedTint, collectedAlpha, unCollectedTint, unCollectedAlpha);
    this.updateIconState(this.icons.ticket, this.inventory.ticket, collectedTint, collectedAlpha, unCollectedTint, unCollectedAlpha);
  }
  
  private updateIconState(icon: Phaser.GameObjects.Image, collected: boolean, collectedTint: number, collectedAlpha: number, unCollectedTint: number, unCollectedAlpha: number) {
    const targetTint = collected ? collectedTint : unCollectedTint;
    const targetAlpha = collected ? collectedAlpha : unCollectedAlpha;
    
    // Determinar escala original baseada no ícone
    let originalScale = 1;
    if (icon === this.icons.key) originalScale = this.iconOriginalScales.key;
    else if (icon === this.icons.map) originalScale = this.iconOriginalScales.map;
    else if (icon === this.icons.ticket) originalScale = this.iconOriginalScales.ticket;
    
    // Se o item foi coletado recentemente, adicionar efeito de brilho
    if (collected && icon.tint !== collectedTint) {
      // Animação de "coletado" - pulso dourado
      this.tweens.add({
        targets: icon,
        tint: 0xffdd00, // Dourado
        scaleX: originalScale * 1.3,
        scaleY: originalScale * 1.3,
        duration: 200,
        ease: 'Power2',
        yoyo: true,
        onComplete: () => {
          // Voltar ao estado normal após o efeito
          icon.setTint(targetTint);
          icon.setScale(originalScale); // Usar escala original
        }
      });
      
      // Efeito de fade in do alpha
      this.tweens.add({
        targets: icon,
        alpha: targetAlpha,
        duration: 300,
        ease: 'Power2'
      });
    } else {
      // Aplicar estado normal sem animação, mantendo escala original
      icon.setTint(targetTint);
      icon.setAlpha(targetAlpha);
      icon.setScale(originalScale);
    }
  }

  private updateLivesHUD() {
    const livesLeft = Math.max(0, this.maxLives - this.hits);
    
    // Criar representação visual mais moderna das vidas usando emojis
    let livesDisplay = '';
    
    // Corações vermelhos para vidas restantes
    for (let i = 0; i < livesLeft; i++) {
      livesDisplay += '❤️ ';
    }
    
    // Corações quebrados para vidas perdidas
    for (let i = 0; i < this.maxLives - livesLeft; i++) {
      livesDisplay += '💔 ';
    }
    
    this.livesText.setText(`${livesDisplay.trim()}`);
    
    // Garantir escala consistente
    // this.livesText.setScale(1);
    
    // Efeito visual quando perde vida (sem alterar escala permanentemente)
    if (this.hits > 0 && livesLeft > 0) {
      // Animação de "pulso" no texto quando há dano
      this.tweens.add({
        targets: this.livesText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          // Garantir que volta ao tamanho original
          this.livesText.setScale(1);
        }
      });
    }
    
    // Mudança de cor baseada na saúde (menos necessária com emojis coloridos)
    if (livesLeft <= 1) {
      // Manter cor branca para deixar os emojis naturais
      this.livesText.setColor('#ffffff');
    } else if (livesLeft <= 2) {
      this.livesText.setColor('#ffffff');
    } else {
      this.livesText.setColor('#ffffff');
    }
  }

  private showInviteOverlay() {
    const { width, height } = this.cameras.main;
    
    // Overlay de fundo com animação
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(200)
      .setInteractive()
      .setAlpha(0);
    
    // Animação de fade in do overlay
    this.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 300,
      ease: 'Power2'
    });

    // Dimensões do modal do convite
    const modalWidth = Math.min(width * 0.9, 400);
    const modalHeight = Math.min(height * 0.85, 500);
    const borderRadius = 25;
    
    // Sombra do modal (com bordas arredondadas)
    const modalShadow = this.add.graphics()
      .fillStyle(0x000000, 0.4)
      .fillRoundedRect(width / 2 + 6 - modalWidth / 2, height / 2 + 6 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(201);

    // Modal principal (com bordas arredondadas)
    const modal = this.add.graphics()
      .fillStyle(0xffffff, 1)
      .lineStyle(4, 0x8e44ad)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .strokeRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, borderRadius)
      .setDepth(202);

    // Header do convite (inicialmente invisível)
    const headerHeight = 80;
    const header = this.add.graphics()
      .fillStyle(0x8e44ad, 1)
      .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, headerHeight, { tl: borderRadius, tr: borderRadius, bl: 0, br: 0 })
      .setDepth(203)
      .setAlpha(0);

    // Animação de entrada do modal
    modal.setScale(0.1);
    modalShadow.setScale(0.1);
    this.tweens.add({
      targets: [modal, modalShadow],
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Título principal (inicialmente invisível)
    const title = this.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight / 2, `💒 ${INVITE.coupleNames} 💒`, 
      { 
        font: 'bold 24px Arial', 
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    // Subtítulo (inicialmente invisível)
    const subtitle = this.add.text(width / 2, height / 2 - modalHeight / 2 + headerHeight + 30, 
      'Você usou a chave, o mapa e o ingresso e desbloqueou o casamento!',
      { 
        font: '16px Arial', 
        color: '#2c3e50', 
        align: 'center', 
        wordWrap: { width: modalWidth - 40 } 
      })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    // Informações do evento (inicialmente invisíveis)
    const date = this.add.text(width / 2, height / 2 - 60, `📅 Data: ${INVITE.date}`, 
      { 
        font: 'bold 18px Arial', 
        color: '#8e44ad' 
      })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    const time = this.add.text(width / 2, height / 2 - 25, `🕐 Horário: ${INVITE.time}`, 
      { 
        font: 'bold 18px Arial', 
        color: '#8e44ad' 
      })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    const addr = this.add.text(width / 2, height / 2 + 20, `📍 ${INVITE.addressText}`,
      { 
        font: '16px Arial', 
        color: '#2c3e50', 
        align: 'center', 
        wordWrap: { width: modalWidth - 40 } 
      })
      .setOrigin(0.5)
      .setDepth(204)
      .setAlpha(0);

    // Botão "Abrir Convite" estilizado (inicialmente invisível)
    const btnWidth = 200;
    const btnHeight = 50;
    const btnY = height / 2 + modalHeight / 2 - 70; // Centralizado sem o segundo botão

    const btnMaps = this.add.graphics()
      .fillStyle(0x8e44ad, 1)
      .lineStyle(2, 0x7d3c98)
      .fillRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
      .strokeRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
      .setDepth(204)
      .setAlpha(0);

    // Área invisível para capturar cliques no botão
    const btnClickArea = this.add.rectangle(width / 2, btnY, btnWidth, btnHeight, 0x000000, 0)
      .setDepth(206)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const btnMapsText = this.add.text(width / 2, btnY, 'Abrir Convite', 
      { 
        font: 'bold 18px Arial', 
        color: '#ffffff' 
      })
      .setOrigin(0.5)
      .setDepth(205)
      .setAlpha(0);

    // Animação dos conteúdos após o modal abrir (com delay)
    this.time.delayedCall(550, () => {
      // Fade in do header e título principal
      this.tweens.add({
        targets: [header, title],
        alpha: 1,
        duration: 400,
        ease: 'Power2'
      });

      // Fade in do subtítulo com delay
      this.tweens.add({
        targets: subtitle,
        alpha: 1,
        duration: 300,
        delay: 200,
        ease: 'Power2'
      });

      // Fade in das informações do evento
      this.tweens.add({
        targets: date,
        alpha: 1,
        duration: 300,
        delay: 400,
        ease: 'Power2'
      });

      this.tweens.add({
        targets: time,
        alpha: 1,
        duration: 300,
        delay: 500,
        ease: 'Power2'
      });

      this.tweens.add({
        targets: addr,
        alpha: 1,
        duration: 300,
        delay: 600,
        ease: 'Power2'
      });

      // Fade in do botão
      this.tweens.add({
        targets: [btnMaps, btnMapsText, btnClickArea],
        alpha: 1,
        duration: 300,
        delay: 800,
        ease: 'Power2'
      });
    });

    // Efeitos interativos do botão (igual ao checkpoint)
    btnClickArea.on('pointerover', () => {
      this.tweens.add({
        targets: btnClickArea,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2'
      });
      // Mudar a cor do graphics para um tom mais escuro
      btnMaps.clear()
        .fillStyle(0x7d3c98, 1)
        .lineStyle(2, 0x6c2d7f)
        .fillRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
        .strokeRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15);
    });

    btnClickArea.on('pointerout', () => {
      this.tweens.add({
        targets: btnClickArea,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2'
      });
      // Voltar à cor original
      btnMaps.clear()
        .fillStyle(0x8e44ad, 1)
        .lineStyle(2, 0x7d3c98)
        .fillRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15)
        .strokeRoundedRect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 15);
    });

    // Eventos do botão
    btnClickArea.on('pointerdown', () => {
      if (!INVITE.inviteUrl) return;
      const win = window.open(INVITE.inviteUrl, '_blank');
      // Fallback caso o navegador bloqueie popups
      if (!win) {
        window.location.href = INVITE.inviteUrl;
      }
    });
  }

  private createSoundButton() {
    const { width } = this.cameras.main;
    const margin = 20;
    
    // Criar botão de som no canto superior direito
    this.soundButton = this.add.text(width - margin, margin, '♪', {
      font: 'bold 24px Arial',
      color: '#ffffff',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
    })
    .setOrigin(1, 0)
    .setDepth(100)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

    // Configurar clique no botão
    this.soundButton.on('pointerdown', () => {
      this.toggleMusic();
    });

    // Efeito hover
    this.soundButton.on('pointerover', () => {
      this.soundButton.setTint(0xffff00);
    });

    this.soundButton.on('pointerout', () => {
      this.soundButton.clearTint();
    });

    // Atualizar aparência inicial
    this.updateSoundButton();
  }

  private toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    this.updateSoundButton();
    
    // Comunicar com a cena Game para controlar a música
    this.game.events.emit('ui-toggle-music', this.musicEnabled);
  }

  private updateSoundButton() {
    if (this.soundButton) {
      this.soundButton.setText(this.musicEnabled ? '♪' : '♪̸');
      this.soundButton.setAlpha(this.musicEnabled ? 1.0 : 0.5);
    }
  }
}
