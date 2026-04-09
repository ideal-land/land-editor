import Phaser from 'phaser';
import { loadTiledMap } from '../../../../packages/runtime-core/src/systems/MapLoader';
import { WeatherSystem } from '../../../../packages/runtime-core/src/systems/WeatherSystem';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private weather!: WeatherSystem;

  constructor() {
    super('main');
  }

  preload(): void {
    this.load.tilemapTiledJSON('main-map', 'tiled/maps/main.export.json');
    this.load.image('world-tiles', 'assets/processed/tilesets/world.png');
    this.load.image('player', 'assets/processed/chars/player_01.png');
    this.load.image('weather_rain', 'assets/processed/weather/rain_drop.png');
    this.load.image('weather_snow', 'assets/processed/weather/snow_flake.png');
  }

  create(): void {
    const { map } = loadTiledMap(this, 'main-map', 'world-tiles', 'world');
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true);

    this.weather = new WeatherSystem(this);
    this.weather.apply({
      type: 'rain',
      intensity: 0.35,
      wind: 0.12,
      overlayAlpha: 0.08,
      ambientTint: '#90A0B8',
      useSplash: true
    });
  }

  update(): void {
    const speed = 120;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left?.isDown) vx = -speed;
    else if (this.cursors.right?.isDown) vx = speed;

    if (this.cursors.up?.isDown) vy = -speed;
    else if (this.cursors.down?.isDown) vy = speed;

    this.player.setVelocity(vx, vy);
  }
}
