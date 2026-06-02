/**
 * L3 is the medical-safety domain. Every analysis / interaction response MUST
 * carry a `safetyNotice`: this is wellness caution info, not diagnosis, and
 * high / uncertain combinations must recommend consulting a professional.
 * (ROLE_ASSIGNMENT L3 협의 포인트 + TEAM_CONVENTIONS §F + PRODUCT_BRIEF 안전 원칙)
 */
export const SAFETY_NOTICE = {
  interaction:
    '이 결과는 의료 진단이 아니라 건강 관리용 주의정보입니다. 복용 간격을 두고, 질환이나 처방약이 있다면 전문가와 상담하세요.',
  cosmetic:
    '성분 분석 결과는 참고용 주의정보이며 의료 진단이 아닙니다. 피부 반응이 우려되면 전문가와 상담하세요.',
} as const;

/**
 * For high / unknown risk we append an explicit professional-consultation line
 * (안전선: 고위험·불확실 조합엔 전문가 상담 권고 필수).
 */
export function interactionSafetyNotice(riskLevel: string): string {
  if (riskLevel === 'high' || riskLevel === 'unknown') {
    return `${SAFETY_NOTICE.interaction} 특히 이 조합은 위험도가 높거나 불확실하므로 복용 전 전문가 상담을 권고합니다.`;
  }
  return SAFETY_NOTICE.interaction;
}
