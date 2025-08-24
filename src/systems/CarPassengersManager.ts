// CarPassengersManager.ts - Sistema para exibir ícones dos itens coletados próximos ao carro
import type { GameConfiguration } from './GameConfig';
import type { GameState } from './GameState';
import type { CheckpointItem } from './SpawnManager';

export interface PassengerIcon {
  sprite: Phaser.GameObjects.Image;
  item: CheckpointItem;
  isVisible: boolean;
  basePosition: { x: number; y: number };
}

export class CarPassengersManager {
  private scene: Phaser.Scene;
  private state: GameState;
  
  // Referência do carro do jogador
  private carPlayer!: Phaser.Physics.Arcade.Sprite;
  
  // Ícones dos itens coletados próximos ao carro
  private passengerIcons: Map<CheckpointItem, PassengerIcon> = new Map();
  
  // Configurações de posicionamento
  private readonly iconScale = 0.7;
  private readonly iconDepth = 15; // Acima do carro (depth 10)

  constructor(scene: Phaser.Scene, _config: GameConfiguration, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  public initialize(carPlayer: Phaser.Physics.Arcade.Sprite): void {
    this.carPlayer = carPlayer;
    this.createPassengerIcons();
    this.updateIconsVisibility();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Escutar quando um item é coletado para mostrar efeito visual
    this.scene.game.events.on('passenger-collected', (payload: { item: CheckpointItem }) => {
      this.showCollectionEffect(payload.item);
    });
  }

  private createPassengerIcons(): void {
    // Criar ícones para cada item coletado (passageiros e ingresso)
    const items: CheckpointItem[] = ['item1', 'item2', 'item3'];
    
    for (const item of items) {
      const sprite = this.scene.add.image(0, 0, `${item}_icon`);
      sprite.setOrigin(0.5, 0.5);
      sprite.setScale(this.iconScale);
      sprite.setDepth(this.iconDepth);
      sprite.setVisible(false);
      sprite.setScrollFactor(0); // Não rolar com a câmera
      
      // Adicionar um contorno sutil para destacar os ícones
      sprite.setTint(0xffffff);
      
      const passengerIcon: PassengerIcon = {
        sprite,
        item,
        isVisible: false,
        basePosition: { x: 0, y: 0 }
      };
      
      this.passengerIcons.set(item, passengerIcon);
    }
  }

  public update(): void {
    if (this.state.isGameOver || !this.carPlayer || !this.carPlayer.active) {
      this.hideAllIcons();
      return;
    }

    this.updateIconsVisibility();
    this.updateIconsPositions();
  }

  private updateIconsVisibility(): void {
    const inventory = this.state.inventory;
    
    // Atualizar visibilidade baseada no inventário
    this.setIconVisibility('item1', inventory.item1);
    this.setIconVisibility('item2', inventory.item2);
    this.setIconVisibility('item3', inventory.item3);
  }

  private setIconVisibility(item: CheckpointItem, collected: boolean): void {
    const passengerIcon = this.passengerIcons.get(item);
    if (!passengerIcon) return;

    if (collected && !passengerIcon.isVisible) {
      // Mostrar ícone com animação
      this.showIconWithAnimation(passengerIcon);
    } else if (!collected && passengerIcon.isVisible) {
      // Esconder ícone
      this.hideIcon(passengerIcon);
    }
  }

  private showIconWithAnimation(passengerIcon: PassengerIcon): void {
    passengerIcon.isVisible = true;
    passengerIcon.sprite.setVisible(true);
    passengerIcon.sprite.setAlpha(0);
    passengerIcon.sprite.setScale(0);

    // Animação de entrada
    this.scene.tweens.add({
      targets: passengerIcon.sprite,
      alpha: 1,
      scaleX: this.iconScale,
      scaleY: this.iconScale,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  private hideIcon(passengerIcon: PassengerIcon): void {
    passengerIcon.isVisible = false;
    passengerIcon.sprite.setVisible(false);
  }

  private hideAllIcons(): void {
    for (const passengerIcon of this.passengerIcons.values()) {
      this.hideIcon(passengerIcon);
    }
  }

  private updateIconsPositions(): void {
    // Calcular posições relativas ao carro
    const carX = this.carPlayer.x;
    const carY = this.carPlayer.y;
    const carWidth = this.carPlayer.displayWidth;
    const carHeight = this.carPlayer.displayHeight;

    // Posições dos ícones
    const positions = this.calculateIconPositions(carX, carY, carWidth, carHeight);

    // Atualizar posições
    this.updateIconPosition('item1', positions.item1);
    this.updateIconPosition('item2', positions.item2);
    this.updateIconPosition('item3', positions.item3);
  }

  private calculateIconPositions(carX: number, carY: number, carWidth: number, carHeight: number) {
    const horizontalOffset = carWidth * 0.3; // Aumentando um pouco a distância horizontal
    const verticalOffset = carHeight * 0.2; // Reduzindo a distância vertical

    return {
      // Item1 (Elizangela): lado esquerdo do carro
      item1: {
        x: carX - horizontalOffset,
        y: carY - verticalOffset
      },
      // Item2 (Aroldo): lado direito do carro
      item2: {
        x: carX + horizontalOffset,
        y: carY - verticalOffset
      },
      // Item3 (Ingresso): centro na parte inferior do carro
      item3: {
        x: carX,
        y: carY + carHeight * 0.3 // Movendo um pouco mais para baixo
      }
    };
  }

  private updateIconPosition(item: CheckpointItem, position: { x: number; y: number }): void {
    const passengerIcon = this.passengerIcons.get(item);
    if (!passengerIcon || !passengerIcon.isVisible) return;

    // Atualizar posição diretamente
    passengerIcon.sprite.setPosition(position.x, position.y);
    passengerIcon.basePosition = position;
  }

  public showCollectionEffect(item: CheckpointItem): void {
    const passengerIcon = this.passengerIcons.get(item);
    if (!passengerIcon || !passengerIcon.isVisible) return;

    // Efeito de pulsar quando um item é coletado
    this.scene.tweens.add({
      targets: passengerIcon.sprite,
      scaleX: this.iconScale * 1.3,
      scaleY: this.iconScale * 1.3,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        passengerIcon.sprite.setScale(this.iconScale);
      }
    });

    // Efeito de brilho
    this.scene.tweens.add({
      targets: passengerIcon.sprite,
      tint: 0xffdd00,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        passengerIcon.sprite.setTint(0xffffff);
      }
    });
  }

  public destroy(): void {
    // Remover event listeners
    this.scene.game.events.off('passenger-collected');
    
    // Limpar todos os ícones
    for (const passengerIcon of this.passengerIcons.values()) {
      if (passengerIcon.sprite) {
        passengerIcon.sprite.destroy();
      }
    }
    this.passengerIcons.clear();
  }
}
