import { CertaintyLevel, EvidenceSource, FlowNode } from '../types.js';

export interface ConfidenceEvidence {
  hasRouteAnnotation?: boolean; // +0.4
  hasVerifiedSymbolCall?: boolean; // +0.3
  hasStackTraceOrSpan?: boolean; // +0.3
  hasAmbiguousOverload?: boolean; // -0.2
}

export interface ConfidenceResult {
  confidence: number;
  certainty: CertaintyLevel;
  isHeuristic: true;
  evidenceSources: EvidenceSource[];
  unverifiedReasons: string[];
}

export class ConfidenceEngine {
  /**
   * Tính toán điểm tin cậy heuristic dựa trên các trọng số cố định của FlowLens:
   * HeuristicScore = min(1.0, max(0.0, sum(w_i)))
   * Lưu ý: Đây là điểm heuristic để xếp hạng mức độ có bằng chứng, không phải xác suất thống kê chính xác.
   */
  public static calculateConfidence(evidence: ConfidenceEvidence): ConfidenceResult {
    let score = 0.0;
    const evidenceSources: EvidenceSource[] = [];
    const unverifiedReasons: string[] = [];

    if (evidence.hasRouteAnnotation) {
      score += 0.4;
      evidenceSources.push('static_analysis');
    } else {
      unverifiedReasons.push('Chưa xác minh được route annotation/handler trực tiếp trong mã nguồn.');
    }

    if (evidence.hasVerifiedSymbolCall) {
      score += 0.3;
      if (!evidenceSources.includes('static_analysis')) {
        evidenceSources.push('static_analysis');
      }
    } else {
      unverifiedReasons.push('Chưa xác minh được lời gọi hàm/DI cụ thể trong mã nguồn (có thể đang suy đoán theo quy ước đặt tên).');
    }

    if (evidence.hasStackTraceOrSpan) {
      score += 0.3;
      evidenceSources.push('stack_trace');
    } else {
      unverifiedReasons.push('Chưa chạy request/test thực tế hoặc chưa có stack trace/log runtime xác nhận.');
    }

    if (evidence.hasAmbiguousOverload) {
      score -= 0.2;
      unverifiedReasons.push('Phát hiện nhiều implementation/overload hoặc route tương tự có thể gây nhầm lẫn.');
    }

    if (evidenceSources.length === 0) {
      evidenceSources.push('agent_inference');
    }

    score = Math.min(1.0, Math.max(0.0, Math.round(score * 100) / 100));

    let certainty: CertaintyLevel = 'UNKNOWN';
    if (score >= 0.7 && evidence.hasStackTraceOrSpan) {
      certainty = 'EXPLICIT';
    } else if (score > 0) {
      certainty = 'INFERRED';
    }

    return {
      confidence: score,
      certainty,
      isHeuristic: true,
      evidenceSources,
      unverifiedReasons
    };
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
