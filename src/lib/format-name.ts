// 선수/이벤트/팀 이름 한영 병기 포맷터
// 한글이 있으면 "한글 (English)" 형태, 없으면 영문만 (또는 빈 문자열)

export function formatNameKoEn(
  ko: string | null | undefined,
  en: string | null | undefined,
  options?: { fallback?: string }
): string {
  const koTrim = ko?.trim() || "";
  const enTrim = en?.trim() || "";
  if (koTrim && enTrim && koTrim !== enTrim) return `${koTrim} (${enTrim})`;
  return koTrim || enTrim || options?.fallback || "";
}

// 한글 이름만 반환(없으면 영문). 시각적 위계가 큰 헤더 제목에 사용
export function primaryName(
  ko: string | null | undefined,
  en: string | null | undefined
): string {
  return ko?.trim() || en?.trim() || "";
}

// 보조 이름(헤더 아래 작게 표기). ko가 있어야만 영문 노출
export function secondaryName(
  ko: string | null | undefined,
  en: string | null | undefined
): string | null {
  const koTrim = ko?.trim() || "";
  const enTrim = en?.trim() || "";
  return koTrim && enTrim && koTrim !== enTrim ? enTrim : null;
}
