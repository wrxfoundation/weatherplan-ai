/**
 * Chronicle 엔진 핵심 계약.
 *
 * "19개 프로젝트"가 아니라 "1개 엔진 + N개 어댑터" — 모든 소스는 SourceAdapter를
 * 구현하고, 엔진이 fetch → normalize → diff → hash-chain → publish를 공통 실행한다.
 * (스펙: PLAN.md §0)
 */

/** 어댑터 3계열. 인터페이스 공유가 구현 효율의 핵심 (PLAN.md §0). */
export type AdapterFamily = "api-records" | "page-text" | "file-probe";

/**
 * 어댑터가 소스에서 뽑아낸 정규화 레코드 한 건.
 * fields는 원본 필드명을 그대로 보존한다 (원본 보존 원칙).
 */
export interface NormalizedRecord {
  entityId: string;
  sourceUrl: string;
  fields: Record<string, unknown>;
}

/** 레코드 단위 생성/삭제 이벤트가 쓰는 field 값. */
export const RECORD_FIELD = "__record__";

/**
 * changes.jsonl 한 줄 = 산출물 계약 (PLAN.md §0):
 * {observed_at, entity_id, field, before, after, source_url, content_hash, chain_hash}
 * - 레코드 생성: field=__record__, before=null, after=전체 fields
 * - 레코드 삭제: field=__record__, before=전체 fields, after=null (삭제도 이벤트)
 * - 필드 변경:  field=필드명, before/after=이전·이후 값
 */
export interface ChangeEvent {
  observed_at: string;
  entity_id: string;
  field: string;
  before: unknown;
  after: unknown;
  source_url: string;
  content_hash: string;
  chain_hash: string;
}

export type UnsealedEvent = Omit<ChangeEvent, "content_hash" | "chain_hash">;

/** sources/<id>/config.yml 의 파싱 결과. 어댑터별 자유 필드 허용. */
export interface SourceConfig {
  id: string;
  family: AdapterFamily;
  title?: string;
  /** 수집 결과가 0건이어도 정상으로 취급 (기본 false — 빈 응답은 장애로 간주). */
  allow_empty?: boolean;
  /** 한 실행에서 허용하는 삭제 이벤트 비율 상한 (기본 0.3 — 초과 시 부분 응답 의심으로 중단). */
  max_removal_ratio?: number;
  [key: string]: unknown;
}

/** HTTP 클라이언트 — 테스트에서 픽스처 전송으로 치환 가능. */
export interface HttpClient {
  json(url: string, init?: RequestInit): Promise<unknown>;
  text(url: string, init?: RequestInit): Promise<string>;
  raw(url: string, init?: RequestInit): Promise<Response>;
}

export interface CollectContext {
  config: SourceConfig;
  http: HttpClient;
  log: (message: string) => void;
  /** 주입 가능한 현재 시각 (테스트 재현성 — 엔진 코드에서 직접 new Date() 금지). */
  now: () => Date;
}

export interface CollectResult {
  /** 원본 응답 그대로 — data/<id>/snapshots/ 에 무가공 보존된다. */
  raw: unknown;
  records: NormalizedRecord[];
  /**
   * 삭제 감지 범위. 저장된 레코드가 이번 수집분에 없을 때 이 함수가 true를
   * 반환하는 레코드만 삭제 이벤트가 된다 — 수집 윈도 밖으로 밀려난 레코드나
   * 페치에 실패한 대상이 "삭제"로 오탐되는 것을 막는다.
   * 생략 시 저장된 모든 레코드가 삭제 감지 대상.
   */
  removalScope?: (stored: NormalizedRecord) => boolean;
}

export interface SourceAdapter {
  readonly id: string;
  readonly family: AdapterFamily;
  collect(ctx: CollectContext): Promise<CollectResult>;
}
