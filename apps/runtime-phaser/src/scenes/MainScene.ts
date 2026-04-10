import Phaser from 'phaser';
import { loadTiledMap } from '../../../../packages/runtime-core/src/systems/MapLoader';
import { WeatherSystem } from '../../../../packages/runtime-core/src/systems/WeatherSystem';

const GENERATE_API_URL = 'http://localhost:8787/generate';

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
    this.load.json('weather-preset', 'generated/weather-preset.json');
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
    const weatherPreset = this.cache.json.get('weather-preset') as Parameters<WeatherSystem['apply']>[0] | undefined;
    if (!weatherPreset) {
      throw new Error('generated/weather-preset.json 缺失，无法预览最新生成结果');
    }
    this.weather.apply(weatherPreset);

    this.mountChatPanel();
  }

  private mountChatPanel(): void {
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.right = '12px';
    panel.style.bottom = '12px';
    panel.style.width = '360px';
    panel.style.background = 'rgba(0,0,0,0.72)';
    panel.style.padding = '10px';
    panel.style.borderRadius = '8px';
    panel.style.zIndex = '9999';
    panel.style.color = '#fff';

    const input = document.createElement('input');
    input.placeholder = '描述你想生成的场景，例如：再加一条小路';
    input.style.width = '100%';
    input.style.marginBottom = '8px';

    const status = document.createElement('div');
    status.style.fontSize = '12px';
    status.style.marginBottom = '8px';

    const button = document.createElement('button');
    button.textContent = '生成并刷新预览';

    button.onclick = async () => {
      const prompt = input.value.trim();
      if (!prompt) return;

      status.textContent = '生成中...';
      button.disabled = true;

      try {
        const resp = await fetch(GENERATE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          throw new Error(data.error ?? '生成失败');
        }
        status.textContent = '生成完成，正在刷新...';
        window.location.reload();
      } catch (error: any) {
        status.textContent = `生成失败: ${error?.message ?? String(error)}`;
      } finally {
        button.disabled = false;
      }
    };

    panel.appendChild(input);
    panel.appendChild(status);
    panel.appendChild(button);
    document.body.appendChild(panel);
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
