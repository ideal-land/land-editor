export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog';
export type MovementMode = '4dir' | '8dir';

export interface TilesetDef {
  id: string;
  image: string;
  tileWidth: number;
  tileHeight: number;
  firstGid?: number;
  categories: string[];
  autotileHints?: string[];
}

export interface PlaceableDef {
  id: string;
  kind: string;
  sourceType: 'tile' | 'tile-object' | 'sprite' | 'animated-sprite';
  assetRef: string;
  placementModes: string[];
  collision: boolean;
  rotatable: boolean;
  tags?: string[];
  variants?: string[];
}

export interface CharacterAnimation {
  start: number;
  end: number;
  frameRate: number;
  repeat: number;
}

export interface CharacterDef {
  id: string;
  spritesheet: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, CharacterAnimation>;
}

export interface WeatherAssetDef {
  id: string;
  kind: 'rain' | 'snow' | 'fog' | 'splash' | 'overlay';
  texture?: string;
  audio?: string;
}

export interface AssetManifest {
  version: string;
  projectId: string;
  tileSize: number;
  tilesets: TilesetDef[];
  placeables: PlaceableDef[];
  characters: CharacterDef[];
  weatherAssets?: WeatherAssetDef[];
}

export interface MapSize {
  width: number;
  height: number;
}

export interface PlayerSpec {
  characterId: string;
  spawnHint: string;
  movement: MovementMode;
  speed?: number;
}

export interface CameraSpec {
  followPlayer: boolean;
  zoom: number;
  deadzone?: boolean;
}

export interface WeatherPreset {
  type: WeatherType;
  intensity: number;
  wind: number;
  overlayAlpha: number;
  ambientTint: string;
  useSplash: boolean;
  fogDensity?: number;
  sfx?: string;
}

export interface ZoneSpec {
  id: string;
  kind: string;
  areaHint: string;
  size?: 'small' | 'medium' | 'large';
  priority?: number;
}

export interface PathSpec {
  id: string;
  kind: 'line' | 'fork' | 'y-road' | 'loop';
  width: number;
  anchor: string;
  connectZones?: string[];
}

export interface SceneObjectRequest {
  kind: string;
  count: number;
  placement: string;
  orientation?: string;
  zoneId?: string;
}

export interface SceneConstraints {
  mustBeWalkable: boolean;
  preserveOpenCenter: boolean;
  maxObjectDensity?: number;
  mustReachZones?: string[];
}

export interface SceneSpec {
  sceneId: string;
  theme: string;
  tileSize: number;
  mapSize: MapSize;
  player: PlayerSpec;
  camera: CameraSpec;
  weather: WeatherPreset;
  zones: ZoneSpec[];
  paths: PathSpec[];
  objects: SceneObjectRequest[];
  constraints: SceneConstraints;
}

export interface AnchorPoint {
  id: string;
  x: number;
  y: number;
  kind: string;
}

export interface PathSegment {
  id: string;
  points: Array<{ x: number; y: number }>;
  width: number;
  material?: string;
}

export interface ZoneBound {
  zoneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Placement {
  id: string;
  kind: string;
  x: number;
  y: number;
  rotation?: number;
  zoneId?: string;
}

export interface WalkableRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutPlan {
  sceneId: string;
  mapSize: MapSize;
  anchors: AnchorPoint[];
  pathSegments: PathSegment[];
  zoneBounds: ZoneBound[];
  placements: Placement[];
  navigation: {
    walkableRectangles: WalkableRect[];
    spawnCandidates: Array<{ id: string; x: number; y: number }>;
  };
}

export interface GenerationCheck {
  id: string;
  result: 'pass' | 'warning' | 'blocker';
  message: string;
  count?: number;
}

export interface GenerationReport {
  runId: string;
  sceneId: string;
  status: 'success' | 'warning' | 'failed';
  summary?: string;
  scores: {
    playability: number;
    layout: number;
    visualBalance: number;
  };
  checks: GenerationCheck[];
  warnings?: string[];
  blockers?: string[];
  artifacts: Array<{ kind: string; path: string }>;
  repairActions?: string[];
}

export interface SceneChangeRequest {
  changeId: string;
  targetSceneId: string;
  operations: Array<Record<string, unknown> & { op: 'move-zone' | 'set-weather' | 'adjust-object-count' | 'set-path-width' | 'move-spawn' }>;
}
