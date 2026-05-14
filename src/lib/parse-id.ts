// 공개 라우트의 [id] 동적 세그먼트 검증 — 모든 페이지/API에서 동일한 규칙 사용.
// 메타데이터(Number)와 API(parseInt) 파싱 차이로 인한 정합성 깨짐 방지.
// 허용: 양의 정수 (선행 0 불가, 소수점/문자 불가, 32-bit 정수 범위)
const POSITIVE_INT_REGEX = /^[1-9][0-9]{0,9}$/;

export function parsePositiveIntParam(raw: string | undefined | null): number | null {
  if (!raw) return null;
  if (!POSITIVE_INT_REGEX.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}
