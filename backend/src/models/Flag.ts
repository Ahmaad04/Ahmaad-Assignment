import { Candidate } from "./Candidate";

enum FlagSeverity {
    WARNING = 'warning',
    CRITICAL = 'critical',
}

enum FlagStatus {
    OPEN = 'open',
    ACKNOWLEDGE = 'acknowledge',
    OVERRIDDEN = 'overridden',
    RESOLVED = 'resolved',
    REJECTED = 'rejected',
}

interface Flag {
    id: number;
    candidateId: number;
    field: keyof Candidate
    reason: string;
    severity: FlagSeverity;
    status: FlagStatus;
    createdAt: Date;
    updatedAt: Date;
    acknowledgedAt?: Date | null;
    overriddenAt?: Date | null;
    resolvedAt?: Date | null;
    rejectedAt?: Date | null;
}

interface FlagEvaluationResult {
    candidate: Candidate;
    flags: Flag[];
    overallStatus: 'PASS' | 'REVIEW' | 'FAIL';
}

export { FlagSeverity, FlagStatus, Flag, FlagEvaluationResult };