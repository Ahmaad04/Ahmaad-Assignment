// src/models/candidate.model.ts

export interface Candidate {
    // Personal Information
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    legalStatus: 'Permanent Resident' | 'Canadian Citizen' | 'Other';
    otherCitizenships?: string[];
    hasValidDriversLicense: boolean;
    driversLicenseType: string;
    totalInPersonHours: number;
    meetsCanadianPracticeExperience: boolean;

    // Previous and current PRA attempts
    writtenTDM: boolean;
    resultTDM: boolean;
    currentPRAParticipationOtherJurisdiction: boolean;

    // Medical Education
    medicalSchool: string;
    medDegreeProgramName: string;
    graduationYear: number;
    languageOfEducation: string;

    // English Proficiency
    proofOfEnglishProficiency: boolean;
    englishExamExpiredOrExceededMinimumRequirement: boolean;
    activeUseOfEnglish: boolean;

    // Exam Dates
    nacDate: Date;
    mccqe2Date: Date;
    mccqe1Date: Date;
  
  
    // Postgrad Training
    numberOfMonthsOfPostgradTraining: number;
    numberOfMonthsOfIndependentPractice: number;
    completed2YearPostgrad: boolean
  
    //Rotations
    completedSevenRotations: boolean;
    impairmentInAbilityToPractice: boolean;
  
    // Flags Auditing
    acknowledgedRedFlags: string[];
    overriddenRedFlags: string[];
  
    // Audit Timestamps
    createdAt: Date;
    updatedAt: Date;
  }
  