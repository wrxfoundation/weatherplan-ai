/* 3D 전술맵 커스텀 스타일 — OpenFreeMap 벡터 타일(OpenMapTiles 스키마), 키 불필요
 *
 * 색상 주의: MapLibre 스타일 JSON은 CSS 변수를 못 읽는다 — 아래 hex는 tokens.css의
 * 미러 값이다 (bg #081527 / navy-deep #050d1a / surface #0d1e33 / line #1b3050 /
 * grey #7e90ac / accent #35d5ee). tokens.css 변경 시 여기도 함께 갱신할 것.
 *
 * 레이어 구성: 바다·수계 → 행정 경계 → 도로(간선만) → 건물 압출(줌 13+) → 지명.
 * 일반 베이스맵의 잡정보(POI·상호 등)는 싣지 않는다 — 전술맵 밀도 유지.
 */
export const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'

export const STYLE_3D = {
  version: 8,
  glyphs: GLYPHS_URL,
  sources: {
    omt: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: '© OpenStreetMap contributors © OpenFreeMap',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#050d1a' } },
    {
      id: 'water',
      type: 'fill',
      source: 'omt',
      'source-layer': 'water',
      paint: { 'fill-color': '#081527' },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'omt',
      'source-layer': 'waterway',
      paint: { 'line-color': '#0d1e33', 'line-width': 1 },
    },
    {
      id: 'landuse-industrial',
      type: 'fill',
      source: 'omt',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'industrial', 'commercial'],
      paint: { 'fill-color': '#0a1a2e', 'fill-opacity': 0.6 },
    },
    {
      id: 'boundary-country',
      type: 'line',
      source: 'omt',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 2],
      paint: { 'line-color': '#1b3050', 'line-width': 1.4 },
    },
    {
      id: 'boundary-province',
      type: 'line',
      source: 'omt',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 4],
      paint: { 'line-color': '#16283f', 'line-width': 1, 'line-dasharray': [3, 2] },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#1b3050',
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 12, 2.4],
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 9,
      filter: ['in', 'class', 'primary', 'secondary'],
      paint: {
        'line-color': '#122238',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 14, 1.8],
      },
    },
    {
      id: 'rail',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 8,
      filter: ['==', 'class', 'rail'],
      paint: { 'line-color': '#14263d', 'line-width': 0.8, 'line-dasharray': [4, 3] },
    },
    {
      /* 건물 압출 — OSM 높이(render_height) 기반, 없으면 8m 기본. 줌 13부터 */
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': '#10243d',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.82,
      },
    },
    {
      id: 'place-city',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:ko'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 12, 14],
      },
      paint: {
        'text-color': '#7e90ac',
        'text-halo-color': '#050d1a',
        'text-halo-width': 1.4,
      },
    },
  ],
}

/* 시설 라벨 심볼 레이어 — MapLibre의 자동 충돌 회피(겹치면 우선순위 낮은 라벨 숨김) 사용.
 * DOM 마커(아이소 빌딩)와 짝: 라벨만 심볼로, 아이콘은 DOM 유지 */
export function facilityLabelLayer(sourceId) {
  return {
    id: 'dc-labels',
    type: 'symbol',
    source: sourceId,
    minzoom: 8,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-optional': false,
      'symbol-sort-key': ['get', 'sort'],
    },
    paint: {
      'text-color': '#e8f1fb',
      'text-halo-color': '#050d1a',
      'text-halo-width': 1.6,
    },
  }
}
