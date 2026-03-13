import { clsx, type ClassValue } from "clsx";

/** Tailwind 클래스 병합 유틸 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
