export interface UIEventHandlers {
  'ui-checkpoint': (payload: { item: 'item1' | 'item2' | 'item3' }) => void;
  'ui-reset-inventory': () => void;
  'ui-lives': (payload: { maxLives: number; hits: number }) => void;
  'ui-invite': () => void;
  'ui-toggle-music': (enabled: boolean) => void;
  'ui-checkpoint-closed': () => void;
}

export class UIEventManager {
  private scene: Phaser.Scene;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  initialize(): void {
    this.clearPreviousEvents();
  }

  private clearPreviousEvents(): void {
    const events = ['ui-checkpoint', 'ui-reset-inventory', 'ui-lives', 'ui-invite'];
    events.forEach(event => {
      this.scene.game.events.off(event);
    });
  }

  on<K extends keyof UIEventHandlers>(event: K, handler: UIEventHandlers[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    this.scene.game.events.on(event, handler);
  }

  off<K extends keyof UIEventHandlers>(event: K, handler?: UIEventHandlers[K]): void {
    if (handler) {
      this.scene.game.events.off(event, handler);
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.scene.game.events.off(event);
      this.eventHandlers.delete(event);
    }
  }

  emit<K extends keyof UIEventHandlers>(event: K, ...args: Parameters<UIEventHandlers[K]>): void {
    this.scene.game.events.emit(event, ...args);
  }

  destroy(): void {
    // Limpar todos os eventos registrados
    for (const [event, handlers] of this.eventHandlers) {
      handlers.forEach(handler => {
        this.scene.game.events.off(event, handler);
      });
    }
    this.eventHandlers.clear();

    // Limpar eventos específicos
    const events = ['ui-checkpoint', 'ui-reset-inventory', 'ui-lives', 'ui-invite', 'ui-checkpoint-closed', 'ui-restart'];
    events.forEach(event => {
      this.scene.game.events.off(event);
    });
  }
}
