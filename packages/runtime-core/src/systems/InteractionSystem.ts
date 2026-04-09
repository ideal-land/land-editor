import Phaser from 'phaser';

export interface RuntimeInteractable {
  id: string;
  kind: string;
  x: number;
  y: number;
}

export class InteractionSystem {
  private scene: Phaser.Scene;
  private registry: RuntimeInteractable[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  register(interactable: RuntimeInteractable): void {
    this.registry.push(interactable);
  }

  getNearby(x: number, y: number, radius = 24): RuntimeInteractable[] {
    return this.registry.filter((item) => {
      const dx = item.x - x;
      const dy = item.y - y;
      return dx * dx + dy * dy <= radius * radius;
    });
  }
}
