export interface MapOverlayConfig {
  /** Unique identifier for the Mapbox source */
  sourceId: string;
  /** Unique identifier for the Mapbox layer */
  layerId: string;
  /** Localized label displayed in the UI */
  label: string;
  /** Tile templates (WMS/XYZ) used by the raster source */
  tiles: string[];
  /** Size of the tiles rendered by the service (defaults to 256) */
  tileSize?: number;
  /** Optional attribution text displayed by Mapbox */
  attribution?: string;
  /** Optional visibility state when the layer is created */
  visibility?: 'visible' | 'none';
  /** Raster opacity (defaults to 0.7) */
  opacity?: number;
  /** Minimum zoom level for the layer */
  minZoom?: number;
  /** Maximum zoom level for the layer */
  maxZoom?: number;
  /** Insert the layer before the provided layer id (keeps ordering predictable) */
  beforeLayerId?: string;
}

declare const $localize: (messageParts: TemplateStringsArray, ...expressions: unknown[]) => string;

export const DEFAULT_MAP_OVERLAYS: MapOverlayConfig[] = [
  {
    sourceId: 'mae-deforestation-overlay',
    layerId: 'mae-deforestation-overlay-layer',
    label: $localize`:@@map.overlay.maeDeforestation:Deforestación MAE 2020-2022`,
    tiles: [
      '/wms?service=WMS&request=GetMap&version=1.1.1&layers=mae_ide:v_fc010_deforestacion_20_22_a&styles=&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256'
    ],
    tileSize: 256,
    attribution: '© Ministerio del Ambiente del Ecuador',
    opacity: 0.8,
    visibility: 'none'
  }
];
