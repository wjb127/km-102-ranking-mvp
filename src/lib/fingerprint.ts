"use client";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

/** 싱글턴 — FingerprintJS 에이전트 */
let fpPromise: Promise<string> | null = null;

/** 브라우저 유니크 fingerprint 반환 */
export function getFingerprint(): Promise<string> {
  if (fpPromise) return fpPromise;

  fpPromise = FingerprintJS.load()
    .then((fp) => fp.get())
    .then((result) => result.visitorId);

  return fpPromise;
}
