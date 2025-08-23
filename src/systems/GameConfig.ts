// GameConfig.ts - Configurações centralizadas do jogo
export interface GameConfiguration {
  // Velocidades
  baseSpeed: number;
  driveBoost: number;
  gameSpeed: number;
  
  // Dificuldade
  spawnDelay: number;
  minSpawnDelay: number;
  spawnStep: number;
  difficultyInterval: number;
  
  // Rampa de velocidade
  speedRampMax: number;
  speedRampStep: number;
  speedRampInterval: number;
  
  // Sistema de vidas
  maxLives: number;
  invincibilityDuration: number;
  slowDownDuration: number;
  slowDownFactor: number;
  
  // Distâncias dos checkpoints (em metros)
  cp1Distance: number;
  cp2Distance: number;
  cp3Distance: number;
  goalSpawnDistance: number;
  metersPerPixel: number;
  
  // Segurança entre carros
  minCarSafeDistance: number;
  safeDistanceBuffer: number;
  
  // Tamanhos dos sprites (% da altura da tela)
  playerCarHeight: number;
  enemyCarHeight: number;
  potholeHeight: number;
  checkpointHeight: number;
  goalHeight: number;
  
  // Layout da pista
  roadWidthPercent: number;
  
  // Limites de objetos na tela
  maxObstaclesOnScreen: number;
  
  // Audio
  musicVolume: number;
}

export const DEFAULT_CONFIG: GameConfiguration = {
  // Velocidades
  baseSpeed: 2,
  driveBoost: 6,
  gameSpeed: 4,
  
  // Dificuldade
  spawnDelay: 900,
  minSpawnDelay: 500,
  spawnStep: 50,
  difficultyInterval: 15000,
  
  // Rampa de velocidade
  speedRampMax: 2.0,
  speedRampStep: 0.15,
  speedRampInterval: 3000,
  
  // Sistema de vidas
  maxLives: 5,
  invincibilityDuration: 1000,
  slowDownDuration: 1000,
  slowDownFactor: 0.6,
  
  // Distâncias dos checkpoints
  cp1Distance: 1000,
  cp2Distance: 3000,
  cp3Distance: 6000,
  goalSpawnDistance: 1000,
  metersPerPixel: 0.1,
  
  // Segurança entre carros
  minCarSafeDistance: 150,
  safeDistanceBuffer: 30,
  
  // Tamanhos dos sprites
  playerCarHeight: 0.14,
  enemyCarHeight: 0.12,
  potholeHeight: 0.06,
  checkpointHeight: 0.15,
  goalHeight: 0.22,
  
  // Layout da pista
  roadWidthPercent: 0.78,
  
  // Limites
  maxObstaclesOnScreen: 4,
  
  // Audio
  musicVolume: 0.5
};
