import type { Key } from "../i18n";
import type { Me } from "../types";

/** 트랙 필터: "전체" 또는 "십대, 청지기" 같은 목록 */
export const forTrack = (rowTrack: string, track?: string) =>
  !track || !rowTrack || rowTrack === "전체" || rowTrack.split(/[,/]\s*/).some(x => x.trim() && (track.includes(x.trim()) || x.trim().includes(track)));

export function payView(me: Me, t: (k: Key) => string) {
  const s = me.payment.state;
  return {
    cls: { paid: "ok", partial: "warn", unpaid: "bad", checking: "dim", cancelled: "dim" }[s],
    label: { paid: t("paid"), partial: t("partial"), unpaid: t("unpaid"), checking: t("checkingPay"), cancelled: t("cancelled") }[s],
    needPay: s === "unpaid" || s === "partial",
  };
}
