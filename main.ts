// main.ts - Configuração do Phaser 3 com TypeScript
import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { Menu } from './scenes/Menu';
import { Preload } from './scenes/Preload';
import { UI } from './scenes/UI';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: '#000',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640
  },
  scene: [Boot, Preload, Menu, Game, UI],
  parent: 'app'
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
