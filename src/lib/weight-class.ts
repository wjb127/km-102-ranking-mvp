// 체급 한글 표기. value 는 DB의 weight_class 원문과 정확히 일치해야 함.
export const WEIGHT_CLASSES_MEN = [
  { value: "Strawweight", label: "스트로급" },
  { value: "Flyweight", label: "플라이급" },
  { value: "Bantamweight", label: "밴텀급" },
  { value: "Featherweight", label: "페더급" },
  { value: "Lightweight", label: "라이트급" },
  { value: "Welterweight", label: "웰터급" },
  { value: "Middleweight", label: "미들급" },
  { value: "Light Heavyweight", label: "라이트헤비급" },
  { value: "Heavyweight", label: "헤비급" },
  { value: "Super Heavyweight", label: "슈퍼헤비급" },
] as const;

export const WEIGHT_CLASSES_WOMEN = [
  { value: "Women's Atomweight", label: "여성 아톰급" },
  { value: "Women's Strawweight", label: "여성 스트로급" },
  { value: "Women's Flyweight", label: "여성 플라이급" },
  { value: "Women's Bantamweight", label: "여성 밴텀급" },
  { value: "Women's Featherweight", label: "여성 페더급" },
] as const;

export const WEIGHT_CLASSES_OTHER = [
  { value: "Catchweight", label: "캐치웨이트" },
  { value: "Openweight", label: "오픈웨이트" },
] as const;

const WEIGHT_LABEL_KO: Record<string, string> = Object.fromEntries(
  [...WEIGHT_CLASSES_MEN, ...WEIGHT_CLASSES_WOMEN, ...WEIGHT_CLASSES_OTHER].map(
    (w) => [w.value, w.label]
  )
);

export function weightKo(v: string | null | undefined): string {
  return v ? WEIGHT_LABEL_KO[v] ?? v : "-";
}
