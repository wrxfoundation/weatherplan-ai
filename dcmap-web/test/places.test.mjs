// EN 지명 — 사전 우선, 없으면 국어의 로마자 표기법 음역
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { romanize, sigunguT, substationT, placeT, placeKeyT, regionT } from '../src/i18n/places.js'

test('romanize: 기본·연음·자음동화', () => {
  const cases = { 영일: 'Yeongil', 동세종: 'Dongsejong', 신림: 'Sillim', 종로: 'Jongno', 백마: 'Baengma', 설날: 'Seollal', 학익: 'Hagik', 왕십리: 'Wangsimni', 청량리: 'Cheongnyangni', 미금: 'Migeum' }
  for (const [ko, en] of Object.entries(cases)) assert.equal(romanize(ko), en, ko)
  assert.equal(romanize('154kV 동수원(SA)'), '154kV Dongsuwon(SA)')
})

test('sigunguT: 사전 → 복합 시군구 → 음역, KO 모드는 그대로', () => {
  assert.equal(sigunguT('안양시', true), 'Anyang')
  assert.equal(sigunguT('포항시 남구', true), 'Pohang Nam-gu')
  assert.equal(sigunguT('가평군', true), 'Gapyeong-gun')
  assert.equal(sigunguT('서해구', true), 'Seohae-gu')
  assert.equal(sigunguT('안양시', false), '안양시')
})

test('substationT: 건설중 표기는 뜻으로', () => {
  assert.equal(substationT('동면(건설중)', true), 'Dongmyeon (under construction)')
  assert.equal(substationT('동면(건설중)', false), '동면(건설중)')
})

test('placeT·placeKeyT·regionT', () => {
  assert.equal(placeT('경기', '안양시', true), 'Anyang, Gyeonggi')
  assert.equal(placeKeyT('서울 용산구', true), 'Yongsan-gu, Seoul')
  assert.equal(regionT('대전세종충남+경기북부', true), 'Daejeon·Sejong·Chungnam + N. Gyeonggi')
})
