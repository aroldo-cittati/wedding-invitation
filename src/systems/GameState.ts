// GameState.ts - Gerenciamento do estado do jogo
export interface Inventory {
  item1: boolean;
  item2: boolean;
  item3: boolean;
}

export interface GameStats {
  hits: number;
  distanceTraveled: number;
  speedRamp: number;
}

export interface CheckpointState {
  cp1Spawned: boolean;
  cp2Spawned: boolean;
  cp3Spawned: boolean;
  lastCheckpointCollected: number;
}

export class GameState {
  // Estados principais
  public isGameOver: boolean = false;
  public restarting: boolean = false;
  public driving: boolean = false;
  public pausedForOverlay: boolean = false;
  public spawningDisabled: boolean = false;
  public finalApproach: boolean = false;
  public goalSpawned: boolean = false;
  
  // Estados temporários
  public invincible: boolean = false;
  public slowDownUntil: number = 0;
  
  // Inventário
  public inventory: Inventory = { item1: false, item2: false, item3: false };
  
  // Estatísticas
  public stats: GameStats = {
    hits: 0,
    distanceTraveled: 0,
    speedRamp: 0
  };
  
  // Checkpoints
  public checkpoints: CheckpointState = {
    cp1Spawned: false,
    cp2Spawned: false,
    cp3Spawned: false,
    lastCheckpointCollected: 0
  };
  
  // Configurações de interface
  public showDebugHUD: boolean = false;
  public musicEnabled: boolean = true;
  
  // Controles
  public pointerOffsetX: number = 0;

  public reset(): void {
    this.isGameOver = false;
    this.restarting = false;
    this.driving = false;
    this.pausedForOverlay = false;
    this.spawningDisabled = false;
    this.finalApproach = false;
    this.goalSpawned = false;
    
    this.invincible = false;
    this.slowDownUntil = 0;
    
    this.inventory = { item1: false, item2: false, item3: false };
    
    this.stats = {
      hits: 0,
      distanceTraveled: 0,
      speedRamp: 0
    };
    
    this.checkpoints = {
      cp1Spawned: false,
      cp2Spawned: false,
      cp3Spawned: false,
      lastCheckpointCollected: 0
    };
    
    this.pointerOffsetX = 0;
  }

  public hasAllItems(): boolean {
    return this.inventory.item1 && this.inventory.item2 && this.inventory.item3;
  }

  public collectItem(item: keyof Inventory): void {
    this.inventory[item] = true;
  }

  public isSlowedDown(currentTime: number): boolean {
    return currentTime < this.slowDownUntil;
  }

  public takeDamage(): void {
    this.stats.hits++;
  }

  public updateDistance(distance: number): void {
    this.stats.distanceTraveled += distance;
  }

  public increaseSpeedRamp(step: number, max: number): void {
    this.stats.speedRamp = Math.min(max, this.stats.speedRamp + step);
  }
}
