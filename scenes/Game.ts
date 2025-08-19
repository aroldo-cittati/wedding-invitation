// Game.ts - Cena principal do jogo
export class Game extends Phaser.Scene {
  private road!: Phaser.GameObjects.TileSprite;
  private carPlayer!: Phaser.Physics.Arcade.Sprite;
  private gameSpeed: number = 4;
  private baseSpeed: number = 0;
  private driveBoost: number = 6;
  private driving: boolean = false;
  private speedText!: Phaser.GameObjects.Text;
  private roadWidth: number = 280; // será recalculado em create()
  private roadCenterX: number = 180; // será recalculado em create()
  private pointerOffsetX: number = 0;

  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Primeiro, adicionar um fundo de emergência para garantir que algo apareça
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x333333);

  // Calcular centro e largura "útil" da pista dinamicamente
  this.roadCenterX = width / 2;
  this.roadWidth = Math.floor(width * 0.78); // ~11% margem em cada lado

    // Criar estrada (tileSprite) - ocupando a tela toda
    this.road = this.add.tileSprite(width / 2, height / 2, width, height, 'road');
    this.road.setOrigin(0.5, 0.5);
    this.road.setScrollFactor(0);
    
    // Ajustar a escala do tile (não do objeto) para cobrir toda a tela
    const roadTex = this.textures.get('road');
    const src = roadTex.getSourceImage() as HTMLImageElement;
    if (src && src.width && src.height) {
      const tileScaleX = width / src.width;
      const tileScaleY = height / src.height;
      // Use a maior escala para garantir cobertura completa
      const coverScale = Math.max(tileScaleX, tileScaleY);
      this.road.setTileScale(coverScale, coverScale);
    }

  // Criar carro do jogador (tamanho proporcional à tela)
  this.carPlayer = this.physics.add.sprite(this.roadCenterX, height - 100, 'carPlayer');
  this.carPlayer.setOrigin(0.5, 0.5);

  // Reduzir tamanho do carro mantendo proporção
  const targetCarHeight = Math.round(height * 0.14); // ~14% da altura da tela
  const scale = targetCarHeight / this.carPlayer.height;
  this.carPlayer.setScale(scale);

  // Ajustar corpo físico para o novo tamanho
  const body = this.carPlayer.body as Phaser.Physics.Arcade.Body;
  body.setCollideWorldBounds(false); // Vamos controlar manualmente
  body.setSize(this.carPlayer.displayWidth, this.carPlayer.displayHeight, true);

    // Configurar input do carro (touch/mouse)
    this.carPlayer.setInteractive();
    
  this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Verificar se o ponteiro começou sobre o carro
      const bounds = this.carPlayer.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) {
    this.driving = true;
    // Guardar offset para evitar "pulo" ao iniciar o toque
    this.pointerOffsetX = this.carPlayer.x - pointer.x;
      }
    });

    this.input.on('pointerup', () => {
      this.driving = false;
      this.pointerOffsetX = 0;
    });

    // HUD de velocidade (debug)
    this.speedText = this.add.text(10, 10, `Velocidade: ${this.gameSpeed}`, {
      font: '16px Arial',
      color: '#ffffff'
    });

    // Iniciar cena UI paralela
    this.scene.launch('UI');
  }

  update() {
    // Atualizar velocidade baseado no estado driving
    if (this.driving) {
      this.gameSpeed = this.baseSpeed + this.driveBoost;
      
      // Steering suave - seguir o pointer
      if (this.input.activePointer.isDown) {
        const targetX = this.input.activePointer.x + this.pointerOffsetX;
        const lerpFactor = 0.15;
        
        // Aplicar LERP para movimento suave
        this.carPlayer.x += (targetX - this.carPlayer.x) * lerpFactor;
        
        // Limitar nas bordas da pista
        const roadLeft = this.roadCenterX - this.roadWidth / 2 + this.carPlayer.displayWidth / 2;
        const roadRight = this.roadCenterX + this.roadWidth / 2 - this.carPlayer.displayWidth / 2;
        this.carPlayer.x = Phaser.Math.Clamp(this.carPlayer.x, roadLeft, roadRight);
        
        // Efeito de rotação baseado na direção
        const direction = targetX - this.carPlayer.x;
        const maxRotation = 0.2; // radianos
        this.carPlayer.rotation = Phaser.Math.Clamp(direction * 0.01, -maxRotation, maxRotation);
      }
    } else {
      this.gameSpeed = this.baseSpeed;
      // Retornar rotação ao normal quando não está dirigindo
      this.carPlayer.rotation = Phaser.Math.Linear(this.carPlayer.rotation, 0, 0.1);
    }

    // Fazer a estrada rolar para cima
    this.road.tilePositionY -= this.gameSpeed;

    // Atualizar HUD de velocidade
    this.speedText.setText(`Velocidade: ${this.gameSpeed.toFixed(1)} | Dirigindo: ${this.driving ? 'SIM' : 'NÃO'}`);
  }
}
