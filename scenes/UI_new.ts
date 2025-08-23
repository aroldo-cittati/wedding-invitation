// UI.ts - Cena de interface do usuário refatorada
import type { InventoryItem } from '../components/ui';
import {
    HUDComponent,
    InventoryManager,
    OverlayManager,
    SoundButtonComponent,
    UIEventManager
} from '../components/ui';
import { INVITE } from '../config/invite';

export class UI extends Phaser.Scene {
  private inventoryManager!: InventoryManager;
  private hudComponent!: HUDComponent;
  private soundButton!: SoundButtonComponent;
  private overlayManager!: OverlayManager;
  private eventManager!: UIEventManager;
  
  private maxLives: number = 5;
  private hits: number = 0;

  constructor() {
    super('UI');
  }

  create() {
    this.initializeComponents();
    this.setupEventHandlers();
  }

  private initializeComponents(): void {
    // Inicializar gerenciadores
    this.inventoryManager = new InventoryManager();
    this.eventManager = new UIEventManager(this);
    this.eventManager.initialize();

    // Inicializar componentes visuais
    this.hudComponent = new HUDComponent(this);
    this.hudComponent.create();

    this.soundButton = new SoundButtonComponent(this);
    this.soundButton.create();

    this.overlayManager = new OverlayManager(this);

    // Atualizar HUD inicial
    this.hudComponent.updateInventory(this.inventoryManager.getState());
    this.hudComponent.updateLives(this.maxLives, this.hits);
  }

  private setupEventHandlers(): void {
    // Checkpoint - item coletado
    this.eventManager.on('ui-checkpoint', (payload: { item: InventoryItem }) => {
      this.inventoryManager.collect(payload.item);
      this.hudComponent.updateInventory(this.inventoryManager.getState());
      this.overlayManager.showCheckpointOverlay(payload.item);
    });

    // Reset do inventário
    this.eventManager.on('ui-reset-inventory', () => {
      this.inventoryManager.reset();
      this.hudComponent.updateInventory(this.inventoryManager.getState());
    });

    // Atualização de vidas
    this.eventManager.on('ui-lives', (payload: { maxLives: number; hits: number }) => {
      this.maxLives = payload.maxLives;
      this.hits = payload.hits;
      this.hudComponent.updateLives(this.maxLives, this.hits);
    });

    // Mostrar convite final
    this.eventManager.on('ui-invite', () => {
      this.overlayManager.showInviteOverlay(INVITE);
    });
  }

  destroy() {
    // Limpar todos os componentes
    if (this.hudComponent) {
      this.hudComponent.destroy();
    }
    if (this.soundButton) {
      this.soundButton.destroy();
    }
    if (this.eventManager) {
      this.eventManager.destroy();
    }
  }
}
