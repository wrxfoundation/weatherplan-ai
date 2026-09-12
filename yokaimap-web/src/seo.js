/**
 * SEO/AEO 메타·JSON-LD 빌더 — 순수 모듈.
 * 프론트(YokaiPage)와 빌드 스크립트(scripts/postbuild.mjs)가 같은 함수를 공유해
 * 프리렌더 HTML과 클라이언트 렌더 결과가 어긋나지 않게 한다.
 */

export const slugOf = (e) => e.id.replace(/^kr-/, '')

const VER_LABEL = {
  primary_text: '고전 원전',
  field_record: '채록 기록',
  public_encyclopedia: '공공 백과',
  secondary_compilation: '2차 정리물',
  modern_online: '현대·온라인',
}

export function titleOf(entry) {
  return `${entry.canonical} — 한국요괴지도`
}

/** 답변 우선(answer-first) 설명. 첫 문장이 곧 '무엇인가'에 대한 답이 되게 쓴다. */
export function descriptionOf(entry) {
  const region = entry.sites?.[0]
  const tail = [
    region ? `${region.sido}${region.sigungu ? ` ${region.sigungu}` : ''} 전승` : null,
    `출처 ${entry.sources.map((s) => s.title).slice(0, 2).join('·')}`,
    `검증등급 ${VER_LABEL[entry.verification] ?? entry.verification}`,
  ]
    .filter(Boolean)
    .join(' · ')
  return `${entry.summary} ${tail}`.slice(0, 300)
}

/**
 * 요괴 1체의 JSON-LD.
 * schema.org에 '전승 존재' 타입이 없으므로 DefinedTerm(도감 용어)을 본체로 삼고,
 * 전승지는 Place로, 출처는 citation으로 붙인다.
 */
export function entryJsonLd(entry, origin) {
  const url = `${origin}/yokai/${slugOf(entry)}`
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${url}#term`,
    name: entry.canonical,
    alternateName: [...(entry.aliases ?? []), entry.names?.en].filter(Boolean),
    description: descriptionOf(entry),
    url,
    inDefinedTermSet: { '@type': 'DefinedTermSet', '@id': `${origin}/dogam#set`, name: '한국요괴도감', url: `${origin}/dogam` },
    termCode: entry.id,
    inLanguage: 'ko',
    citation: entry.sources.map((s) => [s.title, s.ref].filter(Boolean).join(' ')),
    subjectOf:
      entry.sites?.length > 0
        ? entry.sites.map((s) => ({
            '@type': 'Place',
            name: s.name,
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'KR',
              addressRegion: s.sido,
              addressLocality: s.sigungu ?? undefined,
            },
            geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng },
          }))
        : undefined,
  }
}

export function datasetJsonLd(meta, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${origin}/#dataset`,
    name: '한국요괴지도 오픈 데이터셋',
    description: `한국 구비전승·문헌 기록의 요괴·신격 ${meta.count}체와 전승지 ${meta.site_count}곳. 각 레코드에 출처(sources)와 검증등급(verification)을 포함한다.`,
    url: origin,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    version: meta.version,
    dateModified: meta.generated_at,
    inLanguage: 'ko',
    creator: { '@type': 'Organization', name: '한국요괴지도', url: origin },
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${origin}/data/yokai.json` },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${origin}/data/yokai.min.json` },
    ],
    isBasedOn: [
      '한국구비문학대계(한국학중앙연구원)',
      '한국민속대백과사전(국립민속박물관)',
      '한국향토문화전자대전(한국학중앙연구원)',
      '국가유산포털(국가유산청)',
    ],
  }
}

export function categoryJsonLd(category, entries, origin) {
  const url = `${origin}/category/${category.id}`
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${url}#set`,
    name: `${category.name} — 한국요괴도감`,
    description: category.blurb,
    url,
    inLanguage: 'ko',
    hasDefinedTerm: entries.map((e) => ({
      '@type': 'DefinedTerm',
      '@id': `${origin}/yokai/${slugOf(e)}#term`,
      name: e.canonical,
      description: e.summary,
      url: `${origin}/yokai/${slugOf(e)}`,
    })),
  }
}

export function regionJsonLd(region, entries, origin) {
  const url = `${origin}/region/${region.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#page`,
    name: `${region.full} 요괴 전승지`,
    description: `${region.full}에 전승지가 기록된 요괴·신격 ${entries.length}체.`,
    url,
    inLanguage: 'ko',
    about: { '@type': 'AdministrativeArea', name: region.full, geo: { '@type': 'GeoCoordinates', latitude: region.lat, longitude: region.lng } },
  }
}
