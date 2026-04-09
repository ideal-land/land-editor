import Phaser from 'phaser';

export interface WeatherPreset {
  type: 'clear' | 'rain' | 'snow' | 'fog';
  intensity: number;
  wind: number;
  overlayAlpha: number;
  ambientTint: string;
  useSplash: boolean;
  fogDensity?: number;
}

export class WeatherSystem {
  private scene: Phaser.Scene;
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  apply(preset: WeatherPreset): void {
    this.clear();

    if (preset.type === 'clear') return;

    const textureKey = preset.type === 'snow' ? 'weather_snow' : 'weather_rain';
    const particles = this.scene.add.particles(0, 0, textureKey, {
      x: { min: 0, max: this.scene.scale.width },
      y: { min: -16, max: 0 },
      lifespan: preset.type === 'snow' ? 6000 : 1200,
      speedY: preset.type === 'snow' ? { min: 10, max: 25 } : { min: 220, max: 360 },
      speedX: { min: preset.wind * 40, max: preset.wind * 80 },
      quantity: Math.max(1, Math.round(4 + preset.intensity * 10)),
      frequency: Math.max(20, Math.round(120 - preset.intensity * 80)),
      scale: preset.type === 'snow' ? { start: 0.7, end: 0.7 } : { start: 0.5, end: 0.5 }
    });

    this.emitters.push(particles.emitters.list[0]);
    this.scene.cameras.main.setBackgroundColor(preset.ambientTint);
  }

  clear(): void {
    for (const emitter of this.emitters) {
      emitter.stop();
      emitter.manager.destroy();
    }
    this.emitters = [];
  }
}
