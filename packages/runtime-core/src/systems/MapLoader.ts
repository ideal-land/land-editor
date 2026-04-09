import Phaser from 'phaser';

export interface LoadedLayer {
  name: string;
  layer: Phaser.Tilemaps.TilemapLayer;
}

export interface LoadMapResult {
  map: Phaser.Tilemaps.Tilemap;
  layers: LoadedLayer[];
}

export function loadTiledMap(scene: Phaser.Scene, key: string, tilesetImageKey: string, tilesetName = 'world'): LoadMapResult {
  const map = scene.make.tilemap({ key });
  const tileset = map.addTilesetImage(tilesetName, tilesetImageKey);

  if (!tileset) {
    throw new Error(`Tileset "${tilesetName}" / image "${tilesetImageKey}" 绑定失败`);
  }

  const layers: LoadedLayer[] = [];
  for (const layerData of map.layers) {
    const layer = map.createLayer(layerData.name, tileset, 0, 0);
    if (layer) {
      layers.push({ name: layerData.name, layer });
    }
  }

  return { map, layers };
}
