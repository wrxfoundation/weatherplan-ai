import { STATUS_LABEL } from '../data/facilities.js'

export function buildDescription(f) {
  const parts = [
    `${f.name} (${STATUS_LABEL[f.status] ?? f.status})`,
    `${f.sido}${f.sigungu ? ` ${f.sigungu}` : ''}`,
    f.operator ? `운영사 ${f.operator}` : null,
    f.power_mw_public != null ? `공개 전력 ${f.power_mw_public}MW` : null,
    f.year ? `${f.year}년` : null,
  ].filter(Boolean)
  return `${parts.join(' · ')} — 한국 데이터센터 현황 맵, 명당 AI`
}

export function buildPlaceJsonLd(f) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: f.name,
    alternateName: f.name_en ?? undefined,
    description: buildDescription(f),
    address: {
      '@type': 'PostalAddress',
      addressCountry: f.country,
      addressRegion: f.sido,
      addressLocality: f.sigungu ?? undefined,
      streetAddress: f.address_public ?? undefined,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: f.lat,
      longitude: f.lng,
    },
  }
}
