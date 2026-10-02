import { CertaintyLevel, FlowNode } from '../types.js';

export interface ConfidenceEvidence {
  hasRouteAnnotation?: boolean; // +0.4
  hasVerifiedSymbolCall?: boolean; // +0.3
  hasStackTraceOrSpan?: boolean; // +0.3
  hasAmbiguousOverload?: boolean; // -0.2
}

export class ConfidenceEngine {
  /**
   * Tính toán điểm tin cậy dựa trên công thức chuẩn của FlowLens:
   * Confidence = min(1.0, max(0.0, sum(w_i)))
   */
  public static calculateConfidence(evidence: ConfidenceEvidence): { confidence: number; certainty: CertaintyLevel } {
    let score = 0.0;

    if (evidence.hasRouteAnnotation) {
      score += 0.4;
    }
    if (evidence.hasVerifiedSymbolCall) {
      score += 0.3;
    }
    if (evidence.hasStackTraceOrSpan) {
      score += 0.3;
    }
    if (evidence.hasAmbiguousOverload) {
      score -= 0.2;
    }

    score = Math.min(1.0, Math.max(0.0, Math.round(score * 100) / 100));

    let certainty: CertaintyLevel = 'UNKNOWN';
    if (score >= 0.7) {
      certainty = 'EXPLICIT';
    } else if (score > 0) {
      certainty = 'INFERRED';
    }

    return { confidence: score, certainty };
  }

  /**
   * Tính toán điểm tổng thể cho toàn bộ phiên điều tra (trung bình có trọng số)
   */
  public static calculateOverallSessionCertainty(nodes: FlowNode[]): number {
    if (!nodes || nodes.length === 0) return 0;
    const total = nodes.reduce((sum, n) => sum + (n.confidence || 0), 0);
    return Math.round((total / nodes.length) * 100) / 100;
  }
}
