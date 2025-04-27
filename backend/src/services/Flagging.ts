import { Candidate } from '../models/Candidate';
import { Flag, FlagSeverity, FlagStatus, FlagEvaluationResult } from '../models/Flag';

export class FlaggingService {
  private static nextFlagId = 1;

  /**
   * Evaluates a Candidate and returns flags and an overall status.
   */
  public evaluateCandidate(candidate: Candidate): FlagEvaluationResult {
    const flags: Flag[] = [];
    const now = new Date();

    // --- 1. Personal Information ---

    // Legal Status (CRITICAL - Red Square)
    if (candidate.legalStatus !== 'Permanent Resident' && candidate.legalStatus !== 'Canadian Citizen') {
      flags.push(this.createFlag(
        candidate.id,
        'legalStatus',
        `Legal status '${candidate.legalStatus}' is not eligible.`,
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // Driver's License (WARNING - White Square)
    if (!candidate.hasValidDriversLicense) {
      flags.push(this.createFlag(
        candidate.id,
        'hasValidDriversLicense',
        'Candidate does not have a valid driver\'s license.',
        FlagSeverity.WARNING,
        now
      ));
    }

    // --- 2. In-Person Hours + Canadian Practice Experience ---

    if (candidate.totalInPersonHours < 720 && !candidate.meetsCanadianPracticeExperience) {
      flags.push(this.createFlag(
        candidate.id,
        'totalInPersonHours',
        `Only ${candidate.totalInPersonHours} in-person hours completed and does not meet Canadian Practice Experience criteria.`,
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // --- 3. Previous and Current PRA Attempts ---

    // Written TDM (CRITICAL - Red)
    if (!candidate.writtenTDM) {
      flags.push(this.createFlag(
        candidate.id,
        'writtenTDM',
        'Candidate has not written the TDM exam.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // Result TDM (CRITICAL - Red)
    if (!candidate.resultTDM) {
      flags.push(this.createFlag(
        candidate.id,
        'resultTDM',
        'Candidate failed the TDM exam.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // Current PRA Participation (CRITICAL - Red)
    if (candidate.currentPRAParticipationOtherJurisdiction) {
      flags.push(this.createFlag(
        candidate.id,
        'currentPRAParticipationOtherJurisdiction',
        'Candidate is participating in a PRA in another jurisdiction.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // --- 4. English Proficiency Checks ---

    if (
      !candidate.proofOfEnglishProficiency &&
      !candidate.englishExamExpiredOrExceededMinimumRequirement &&
      !candidate.activeUseOfEnglish
    ) {
      flags.push(this.createFlag(
        candidate.id,
        'proofOfEnglishProficiency',
        'Candidate lacks proof of English proficiency, English exam did not meet requirements, and no active use of English reported.',
        FlagSeverity.CRITICAL,
        now
      ));
    }
    // No flags if English exam was valid or active use is true (Green = OK)

    // --- 5. Medical Education Fields ---

    // Medical School (WARNING - White)
    if (!candidate.medicalSchool || candidate.medicalSchool.trim() === '') {
      flags.push(this.createFlag(
        candidate.id,
        'medicalSchool',
        'Medical School/University Attended is missing.',
        FlagSeverity.WARNING,
        now
      ));
    }

    // Degree Program Name (WARNING - White)
    if (!candidate.medDegreeProgramName || candidate.medDegreeProgramName.trim() === '') {
      flags.push(this.createFlag(
        candidate.id,
        'medDegreeProgramName',
        'Medical Degree Program Name is missing.',
        FlagSeverity.WARNING,
        now
      ));
    }

    // Graduation Year (WARNING - White)
    if (!candidate.graduationYear || candidate.graduationYear <= 0) {
      flags.push(this.createFlag(
        candidate.id,
        'graduationYear',
        'Graduation Year is missing or invalid.',
        FlagSeverity.WARNING,
        now
      ));
    }

    // Language of Education (WARNING - White)
    if (!candidate.languageOfEducation || candidate.languageOfEducation.trim() === '') {
      flags.push(this.createFlag(
        candidate.id,
        'languageOfEducation',
        'Language of Education is missing.',
        FlagSeverity.WARNING,
        now
      ));
    }

    // --- 6. Exam Dates ---

    // NAC Date (CRITICAL - Red)
    if (!candidate.nacDate) {
      flags.push(this.createFlag(
        candidate.id,
        'nacDate',
        'NAC exam date is missing.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // MCCQE2 Date (CRITICAL - Red)
    if (!candidate.mccqe2Date) {
      flags.push(this.createFlag(
        candidate.id,
        'mccqe2Date',
        'MCCQE2 exam date is missing.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // MCCQE1 Date (CRITICAL - Red)
    if (!candidate.mccqe1Date) {
      flags.push(this.createFlag(
        candidate.id,
        'mccqe1Date',
        'MCCQE1 exam date is missing.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // --- 7. Postgrad Training and Independent Practice ---

    const postgradMonths = candidate.numberOfMonthsOfPostgradTraining;
    const independentMonths = candidate.numberOfMonthsOfIndependentPractice;

    const validTraining =
      (postgradMonths >= 24 && independentMonths >= 24) ||
      (postgradMonths >= 12 && independentMonths >= 36);

    if (!validTraining) {
      flags.push(this.createFlag(
        candidate.id,
        'numberOfMonthsOfPostgradTraining',
        'Postgraduate training and independent practice months do not meet eligibility requirements (24+24 or 12+36 months).',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // Completed 2-Year Postgrad (CRITICAL - Red)
    if (!candidate.completed2YearPostgrad) {
      flags.push(this.createFlag(
        candidate.id,
        'completed2YearPostgrad',
        'Candidate has not completed a 2-year postgraduate program.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // --- 8. Rotations Check ---

    // Completed Seven Rotations (CRITICAL - Red)
    if (!candidate.completedSevenRotations) {
      flags.push(this.createFlag(
        candidate.id,
        'completedSevenRotations',
        'Candidate has not completed the required seven rotations.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // --- 9. Impairment to Ability to Practice ---

    // Impairment Reported (CRITICAL - Red)
    if (candidate.impairmentInAbilityToPractice) {
      flags.push(this.createFlag(
        candidate.id,
        'impairmentInAbilityToPractice',
        'Candidate reports an impairment in ability to practice safely.',
        FlagSeverity.CRITICAL,
        now
      ));
    }

    // --- Determine Overall Status ---

    let overallStatus: 'PASS' | 'REVIEW' | 'FAIL' = 'PASS';
    if (flags.some(f => f.severity === FlagSeverity.CRITICAL)) {
      overallStatus = 'FAIL';
    } else if (flags.some(f => f.severity === FlagSeverity.WARNING)) {
      overallStatus = 'REVIEW';
    }

    return { candidate, flags, overallStatus };
  }

  /**
   * Helper method to create a Flag object with defaults.
   */
  private createFlag(
    candidateId: number,
    field: keyof Candidate,
    reason: string,
    severity: FlagSeverity,
    timestamp: Date
  ): Flag {
    const flagId = FlaggingService.nextFlagId++;
    return {
      id: flagId,
      candidateId,
      field,
      reason,
      severity,
      status: FlagStatus.OPEN,
      createdAt: timestamp,
      updatedAt: timestamp,
      acknowledgedAt: null,
      overriddenAt: null,
      resolvedAt: null,
      rejectedAt: null,
    };
  }
}
