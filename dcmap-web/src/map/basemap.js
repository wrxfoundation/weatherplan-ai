/* 다크 베이스맵 — 2D(Leaflet) 지도 공용
 *
 * 2026.10 CARTO가 raster basemap(dark_all 등)을 API 키 필수로 전환해, 키 없이 요청하면
 * 'API KEY REQUIRED' 워터마크 타일만 내려온다. 키 없이 동작하는 Esri World Dark Gray로 교체.
 * (3D 맵은 OpenFreeMap 벡터 타일이라 영향 없음.)
 *
 * - Base(지형·수계) + Reference(지명 라벨) 2장 겹침. 라벨이 위.
 * - 네이티브 최대 줌 16 — 그 위는 업스케일(maxNativeZoom)해서 빈 타일 대신 흐린 타일을 보인다.
 * - 네이비 톤은 app.css의 .leaflet-tile 필터가 입힌다(중립 회색 → 딥 네이비).
 */
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
// Esri 요구 출처(Esri·HERE·Garmin·OSM)는 유지하되 짧게 — 작은 지도에서 두 줄로 넘치던 것
const ESRI_ATTR =
  '&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, <a href="https://www.openstreetmap.org/copyright">OSM</a>'

export const DARK_BASE_TILES = [
  { url: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, attr: ESRI_ATTR, maxNativeZoom: 16 },
  { url: `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, attr: '', maxNativeZoom: 16 },
]
