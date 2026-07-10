#!/usr/bin/env node
/**
 * dc_seed_v0.1.json → dc_centers.json 지오코딩 파이프라인 (SPEC §5.1)
 *
 * 규칙:
 *  - address_public 있음 → 필지 지오코딩, geocode_level: "parcel"
 *  - sigungu 있음      → 시군구 중심점(시군구청), geocode_level: "sigungu"
 *  - sido만 있음       → 시도 중심점(시도청),   geocode_level: "sido"
 *
 * 좌표는 data/geo_lookup.json 캐시를 우선 사용한다(vworld 지오코딩 산출물).
 * 캐시 미스 항목은 VWORLD_KEY 환경변수가 있으면 vworld REST API로 조회하고,
 * 없으면 에러로 중단한다(시드에 신규 지역 추가 시 캐시를 갱신하거나 키를 제공).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const seed = JSON.parse(readFileSync(join(ROOT, 'data/dc_seed_v0.1.json'), 'utf8'))
const lookup = JSON.parse(readFileSync(join(ROOT, 'data/geo_lookup.json'), 'utf8'))

const VWORLD_KEY = process.env.VWORLD_KEY || null
const KR_BBOX = { latMin: 33, latMax: 39.5, lngMin: 124, lngMax: 132 }

async function vworldGeocode(address, type = 'ROAD') {
  const url = `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&type=${type}&address=${encodeURIComponent(address)}&key=${VWORLD_KEY}`
  const res = await fetch(url)
  const json = await res.json()
  const p = json?.response?.result?.point
  if (!p) throw new Error(`vworld geocode 실패: ${address}`)
  return { lat: Number(p.y), lng: Number(p.x) }
}

async function vworldSearch(query) {
  const url = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=epsg:4326&size=1&query=${encodeURIComponent(query)}&type=place&key=${VWORLD_KEY}`
  const res = await fetch(url)
  const json = await res.json()
  const item = json?.response?.result?.items?.[0]
  if (!item?.point) throw new Error(`vworld search 실패: ${query}`)
  return { lat: Number(item.point.y), lng: Number(item.point.x) }
}

async function resolve(f) {
  if (f.address_public) {
    let pt = lookup.parcel[f.address_public]
    if (!pt && VWORLD_KEY) pt = await vworldGeocode(f.address_public)
    if (!pt) throw new Error(`필지 좌표 캐시 미스(VWORLD_KEY 필요): ${f.id} ${f.address_public}`)
    return { ...pt, geocode_level: 'parcel' }
  }
  if (f.sigungu) {
    const key = `${f.sido} ${f.sigungu}`
    let pt = lookup.sigungu[key]
    if (!pt && VWORLD_KEY) pt = await vworldSearch(`${f.sigungu}청`)
    if (!pt) throw new Error(`시군구 좌표 캐시 미스(VWORLD_KEY 필요): ${f.id} ${key}`)
    return { ...pt, geocode_level: 'sigungu' }
  }
  const pt = lookup.sido[f.sido]
  if (!pt) throw new Error(`시도 좌표 없음: ${f.id} ${f.sido}`)
  return { ...pt, geocode_level: 'sido' }
}

const out = []
for (const f of seed.facilities) {
  const { lat, lng, geocode_level } = await resolve(f)
  if (lat < KR_BBOX.latMin || lat > KR_BBOX.latMax || lng < KR_BBOX.lngMin || lng > KR_BBOX.lngMax) {
    throw new Error(`좌표가 한국 영역 밖: ${f.id} (${lat}, ${lng})`)
  }
  out.push({ ...f, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), geocode_level })
}

const centers = {
  version: seed.version,
  generated_at: seed.frozen_at,
  count: out.length,
  facilities: out,
}
writeFileSync(join(ROOT, 'data/dc_centers.json'), JSON.stringify(centers, null, 2) + '\n')
console.log(`dc_centers.json 생성: ${out.length}건`)
for (const lv of ['parcel', 'sigungu', 'sido']) {
  console.log(`  ${lv}: ${out.filter((x) => x.geocode_level === lv).length}건`)
}
