import { CertaintyLevel, FlowNode } from '../types.js';
export interface ConfidenceEvidence {
    hasRouteAnnotation?: boolean;
    hasVerifiedSymbolCall?: boolean;
    hasStackTraceOrSpan?: boolean;
    hasAmbiguousOverload?: boolean;
}
export declare class ConfidenceEngine {
    /**
     * Tính toán điểm tin cậy dựa trên công thức chuẩn của FlowLens:
     * Confidence = min(1.0, max(0.0, sum(w_i)))
     */
    static calculateConfidence(evidence: ConfidenceEvidence): {
        confidence: number;
        certainty: CertaintyLevel;
    };
    /**
     * Tính toán điểm tổng thể cho toàn bộ phiên điều tra (trung bình có trọng số)
     */
    static calculateOverallSessionCertainty(nodes: FlowNode[]): number;
}
