angular.module('flaggingApp', [])
.controller('FlagController', function($http, $window, $scope) {
  var vm = this;
  
  // Initialize properties
  vm.candidate = {
    id: Date.now(), // Generate a temporary ID
    createdAt: new Date(),
    updatedAt: new Date()
  };
  vm.flags = [];
  vm.overallStatus = '';
  vm.showHints = true;
  vm.validationErrors = [];
  
  // Section navigation
  vm.sections = ['personal', 'practice', 'education', 'proficiency', 'exams'];
  vm.sectionNames = {
    'personal': 'Personal Information',
    'practice': 'Practice & Experience',
    'education': 'Medical Education',
    'proficiency': 'English Proficiency',
    'exams': 'Exam Dates'
  };
  vm.activeSection = 'personal';
  vm.currentSection = 1;
  vm.totalSections = vm.sections.length;

  // Helper to capitalize section names for validation lookup
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Initialize from localStorage
  vm.init = function() {
    var saved = $window.localStorage.getItem('flaggingState');
    if (saved) {
      var state = JSON.parse(saved);
      
      // Handle date objects
      if (state.candidate) {
        if (state.candidate.dateOfBirth) state.candidate.dateOfBirth = new Date(state.candidate.dateOfBirth);
        if (state.candidate.nacDate) state.candidate.nacDate = new Date(state.candidate.nacDate);
        if (state.candidate.mccqe1Date) state.candidate.mccqe1Date = new Date(state.candidate.mccqe1Date);
        if (state.candidate.mccqe2Date) state.candidate.mccqe2Date = new Date(state.candidate.mccqe2Date);
        if (state.candidate.createdAt) state.candidate.createdAt = new Date(state.candidate.createdAt);
        if (state.candidate.updatedAt) state.candidate.updatedAt = new Date(state.candidate.updatedAt);
      }
      vm.candidate = state.candidate || vm.candidate;
      vm.flags = state.flags || [];
      vm.overallStatus = state.overallStatus || '';
    }
  };

  // Save to localStorage
  vm.saveState = function() {
    var state = { candidate: vm.candidate, flags: vm.flags, overallStatus: vm.overallStatus };
    $window.localStorage.setItem('flaggingState', JSON.stringify(state));
  };

  // Clear stored state & form
  vm.clearData = function() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      $window.localStorage.removeItem('flaggingState');
      vm.candidate = { id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
      vm.flags = [];
      vm.overallStatus = '';
    }
  };

  // Section navigation methods
  vm.setActiveSection = function(section) {
    vm.activeSection = section;
    vm.currentSection = vm.sections.indexOf(section) + 1;
  };
  
  // Updated nextSection with validation guard
  vm.nextSection = function() {
    var currentIndex = vm.sections.indexOf(vm.activeSection);

    // Run the validation for the current section
    var validateFnName = 'validate' + capitalize(vm.activeSection) + 'Section';
    var validateFn = vm[validateFnName];
    if (typeof validateFn === 'function') {
      vm.validationErrors = [];
      validateFn();
      if (vm.validationErrors.length > 0) {
        // Validation failed, do not proceed
        return;
      }
    }

    // If no errors and there is another section, advance
    if (currentIndex < vm.sections.length - 1) {
      vm.activeSection = vm.sections[currentIndex + 1];
      vm.currentSection = currentIndex + 2;
    }
  };
  
  vm.previousSection = function() {
    var currentIndex = vm.sections.indexOf(vm.activeSection);
    if (currentIndex > 0) {
      vm.activeSection = vm.sections[currentIndex - 1];
      vm.currentSection = currentIndex;
    }
  };
  
  vm.hasNextSection = function() {
    return vm.sections.indexOf(vm.activeSection) < vm.sections.length - 1;
  };
  
  vm.hasPreviousSection = function() {
    return vm.sections.indexOf(vm.activeSection) > 0;
  };
  
  vm.getProgress = function() {
    return (vm.currentSection / vm.totalSections) * 100;
  };


  // Format field names for display
  vm.formatFieldName = function(field) {
    if (!field) return '';
    
    // Custom mappings for better readability
    var fieldMappings = {
      'legalStatus': 'Legal Status',
      'hasValidDriversLicense': 'Driver\'s License',
      'totalInPersonHours': 'In-Person Hours',
      'meetsCanadianPracticeExperience': 'Canadian Experience',
      'writtenTDM': 'TDM Exam Taken',
      'resultTDM': 'TDM Exam Result',
      'currentPRAParticipationOtherJurisdiction': 'PRA Participation',
      'medicalSchool': 'Medical School',
      'medDegreeProgramName': 'Degree Program',
      'graduationYear': 'Graduation Year',
      'languageOfEducation': 'Education Language',
      'proofOfEnglishProficiency': 'English Proficiency',
      'englishExamExpiredOrExceededMinimumRequirement': 'English Exam',
      'activeUseOfEnglish': 'Active English Use',
      'nacDate': 'NAC Exam Date',
      'mccqe1Date': 'MCCQE1 Date',
      'mccqe2Date': 'MCCQE2 Date',
      'numberOfMonthsOfPostgradTraining': 'Postgrad Training',
      'numberOfMonthsOfIndependentPractice': 'Independent Practice',
      'completed2YearPostgrad': '2-Year Postgrad',
      'completedSevenRotations': 'Seven Rotations',
      'impairmentInAbilityToPractice': 'Practice Impairment'
    };
    
    return fieldMappings[field] || field;
  };

  // Count flags by severity
  vm.getCriticalCount = function() {
    return vm.flags.filter(function(flag) {
      return flag.severity === 'critical';
    }).length;
  };
  
  vm.getWarningCount = function() {
    return vm.flags.filter(function(flag) {
      return flag.severity === 'warning';
    }).length;
  };

  // Improved evaluation with feedback
  vm.evaluateCandidate = function() {
    vm.candidate.updatedAt = new Date();
    
    // Create a FlaggingService-like object
    var flaggingService = {
      nextFlagId: 1,
      evaluateCandidate: function(candidate) {
        var flags = [];
        var now = new Date();
        
        // --- 1. Personal Information ---
        if (candidate.legalStatus !== 'Permanent Resident' && candidate.legalStatus !== 'Canadian Citizen') {
          flags.push(this.createFlag(
            candidate.id,
            'legalStatus',
            `Legal status '${candidate.legalStatus}' is not eligible.`,
            'critical',
            now
          ));
        }

        if (!candidate.hasValidDriversLicense) {
          flags.push(this.createFlag(
            candidate.id,
            'hasValidDriversLicense',
            'Candidate does not have a valid driver\'s license.',
            'warning',
            now
          ));
        }

        // --- 2. In-Person Hours + Canadian Practice Experience ---
        if (candidate.totalInPersonHours < 720 && !candidate.meetsCanadianPracticeExperience) {
          flags.push(this.createFlag(
            candidate.id,
            'totalInPersonHours',
            `Only ${candidate.totalInPersonHours} in-person hours completed and does not meet Canadian Practice Experience criteria.`,
            'critical',
            now
          ));
        }

        // --- 3. Previous and Current PRA Attempts ---
        if (!candidate.writtenTDM) {
          flags.push(this.createFlag(
            candidate.id,
            'writtenTDM',
            'Candidate has not written the TDM exam.',
            'critical',
            now
          ));
        }

        if (!candidate.resultTDM) {
          flags.push(this.createFlag(
            candidate.id,
            'resultTDM',
            'Candidate failed the TDM exam.',
            'critical',
            now
          ));
        }

        if (candidate.currentPRAParticipationOtherJurisdiction) {
          flags.push(this.createFlag(
            candidate.id,
            'currentPRAParticipationOtherJurisdiction',
            'Candidate is participating in a PRA in another jurisdiction.',
            'critical',
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
            'critical',
            now
          ));
        }

        // --- 5. Medical Education Fields ---
        if (!candidate.medicalSchool || candidate.medicalSchool.trim() === '') {
          flags.push(this.createFlag(
            candidate.id,
            'medicalSchool',
            'Medical School/University Attended is missing.',
            'warning',
            now
          ));
        }

        if (!candidate.medDegreeProgramName || candidate.medDegreeProgramName.trim() === '') {
          flags.push(this.createFlag(
            candidate.id,
            'medDegreeProgramName',
            'Medical Degree Program Name is missing.',
            'warning',
            now
          ));
        }

        if (!candidate.graduationYear || candidate.graduationYear <= 0) {
          flags.push(this.createFlag(
            candidate.id,
            'graduationYear',
            'Graduation Year is missing or invalid.',
            'warning',
            now
          ));
        }

        if (!candidate.languageOfEducation || candidate.languageOfEducation.trim() === '') {
          flags.push(this.createFlag(
            candidate.id,
            'languageOfEducation',
            'Language of Education is missing.',
            'warning',
            now
          ));
        }

        // --- 6. Exam Dates ---
        if (!candidate.nacDate) {
          flags.push(this.createFlag(
            candidate.id,
            'nacDate',
            'NAC exam date is missing.',
            'critical',
            now
          ));
        }

        if (!candidate.mccqe2Date) {
          flags.push(this.createFlag(
            candidate.id,
            'mccqe2Date',
            'MCCQE2 exam date is missing.',
            'critical',
            now
          ));
        }

        if (!candidate.mccqe1Date) {
          flags.push(this.createFlag(
            candidate.id,
            'mccqe1Date',
            'MCCQE1 exam date is missing.',
            'critical',
            now
          ));
        }

        // --- 7. Postgrad Training and Independent Practice ---
        const postgradMonths = candidate.numberOfMonthsOfPostgradTraining || 0;
        const independentMonths = candidate.numberOfMonthsOfIndependentPractice || 0;

        const validTraining =
          (postgradMonths >= 24 && independentMonths >= 24) ||
          (postgradMonths >= 12 && independentMonths >= 36);

        if (!validTraining) {
          flags.push(this.createFlag(
            candidate.id,
            'numberOfMonthsOfPostgradTraining',
            'Postgraduate training and independent practice months do not meet eligibility requirements (24+24 or 12+36 months).',
            'critical',
            now
          ));
        }

        if (!candidate.completed2YearPostgrad) {
          flags.push(this.createFlag(
            candidate.id,
            'completed2YearPostgrad',
            'Candidate has not completed a 2-year postgraduate program.',
            'critical',
            now
          ));
        }

        // --- 8. Rotations Check ---
        if (!candidate.completedSevenRotations) {
          flags.push(this.createFlag(
            candidate.id,
            'completedSevenRotations',
            'Candidate has not completed the required seven rotations.',
            'critical',
            now
          ));
        }

        // --- 9. Impairment to Ability to Practice ---
        if (candidate.impairmentInAbilityToPractice) {
          flags.push(this.createFlag(
            candidate.id,
            'impairmentInAbilityToPractice',
            'Candidate reports an impairment in ability to practice safely.',
            'critical',
            now
          ));
        }

        // --- Determine Overall Status ---
        let overallStatus = 'PASS';
        if (flags.some(f => f.severity === 'critical')) {
          overallStatus = 'FAIL';
        } else if (flags.some(f => f.severity === 'warning')) {
          overallStatus = 'REVIEW';
        }

        return { candidate, flags, overallStatus };
      },
      createFlag: function(candidateId, field, reason, severity, timestamp) {
        return {
          id: this.nextFlagId++,
          candidateId: candidateId,
          field: field,
          reason: reason,
          severity: severity,
          status: 'open',
          createdAt: timestamp,
          updatedAt: timestamp
        };
      }
    };
    
    // Directly evaluate without delay
    var result = flaggingService.evaluateCandidate(vm.candidate);
    vm.flags = result.flags;
    vm.overallStatus = result.overallStatus;
    vm.saveState();
    
    // Scroll to results with smooth animation
    setTimeout(function() {
      var resultsCard = document.querySelector('.results-card');
      if (resultsCard) {
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Add a method to show helpful tooltips
  vm.showHelp = function(field) {
    // Define help content for common fields
    const helpContent = {
      'legalStatus': 'Only Permanent Residents and Canadian Citizens are eligible for this program.',
      'totalInPersonHours': 'A minimum of 720 in-person hours is required unless Canadian practice experience criteria is met.',
      // Add more helpful tooltips as needed
    };
    
    // Display the help tooltip for this field
    // Implementation depends on your tooltip library
    alert(helpContent[field] || 'No additional help available for this field.');
  };

  // Flag management
  vm.acknowledgeFlag = function(flag) {
    flag.status = 'ACKNOWLEDGE';
    flag.acknowledgedAt = new Date();
    vm.saveState();
  };

  vm.overrideFlag = function(flag) {
    flag.status = 'OVERRIDDEN';
    flag.overriddenAt = new Date();
    vm.saveState();
  };
  
  // Print results
  vm.printResults = function() {
    window.print();
  };

  // Validation methods
  vm.validateAndEvaluate = function(event) {
    // Prevent default form submission
    if (event) {
      event.preventDefault();
    }
    
    // Clear previous validation errors
    vm.validationErrors = [];
    
    // Validate all sections
    vm.validatePersonalSection();
    vm.validatePracticeSection();
    vm.validateEducationSection();
    vm.validateProficiencySection();
    vm.validateExamsSection();
    
    // If there are validation errors, show them and don't submit
    if (vm.validationErrors.length > 0) {
      // Apply shake animation to the validation error element
      var validationError = document.querySelector('.validation-error');
      if (validationError) {
        validationError.classList.add('shake');
        setTimeout(function() {
          validationError.classList.remove('shake');
        }, 500);
      }
      
      // Scroll to the validation message
      validationError.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return false;
    }
    
    // All validations passed, proceed with evaluation
    vm.evaluateCandidate();
    return true;
  };

  // Validation for Personal section
  vm.validatePersonalSection = function() {
    // First Name
    if (!vm.candidate.firstName || vm.candidate.firstName.trim() === '') {
      vm.validationErrors.push('First Name is required');
    }
    
    // Last Name
    if (!vm.candidate.lastName || vm.candidate.lastName.trim() === '') {
      vm.validationErrors.push('Last Name is required');
    }
    
    // Email
    if (!vm.candidate.email || vm.candidate.email.trim() === '') {
      vm.validationErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vm.candidate.email)) {
      vm.validationErrors.push('Email must be in a valid format');
    }
    
    // Date of Birth
    if (!vm.candidate.dateOfBirth) {
      vm.validationErrors.push('Date of Birth is required');
    }
    
    // Legal Status
    if (!vm.candidate.legalStatus) {
      vm.validationErrors.push('Legal Status is required');
    }
  };

  // Validation for Practice section
  vm.validatePracticeSection = function() {
    // In-Person Hours
    if (vm.candidate.totalInPersonHours === undefined || vm.candidate.totalInPersonHours === null) {
      vm.validationErrors.push('Total In-Person Hours is required');
    } else if (isNaN(vm.candidate.totalInPersonHours) || vm.candidate.totalInPersonHours < 0) {
      vm.validationErrors.push('Total In-Person Hours must be a valid number');
    }
    
    // Check if they need validation for Canadian Practice Experience
    if (vm.candidate.totalInPersonHours < 720 && !vm.candidate.meetsCanadianPracticeExperience) {
      vm.validationErrors.push('Either 720+ in-person hours or Canadian Practice Experience is required');
    }
    
    // Validate months if entered
    if (vm.candidate.numberOfMonthsOfPostgradTraining !== undefined && 
        vm.candidate.numberOfMonthsOfIndependentPractice !== undefined) {
      const postgradMonths = vm.candidate.numberOfMonthsOfPostgradTraining || 0;
      const independentMonths = vm.candidate.numberOfMonthsOfIndependentPractice || 0;
      
      const validTraining = 
        (postgradMonths >= 24 && independentMonths >= 24) ||
        (postgradMonths >= 12 && independentMonths >= 36);
        
      if (!validTraining) {
        vm.validationErrors.push('Training must meet requirements: either 24+ months postgrad with 24+ months practice, or 12+ months postgrad with 36+ months practice');
      }
    }
  };

  // Validation for Education section
  vm.validateEducationSection = function() {
    // Medical School
    if (!vm.candidate.medicalSchool || vm.candidate.medicalSchool.trim() === '') {
      vm.validationErrors.push('Medical School is required');
    }
    
    // Degree Program
    if (!vm.candidate.medDegreeProgramName || vm.candidate.medDegreeProgramName.trim() === '') {
      vm.validationErrors.push('Medical Degree Program is required');
    }
    
    // Graduation Year
    if (!vm.candidate.graduationYear) {
      vm.validationErrors.push('Graduation Year is required');
    } else if (isNaN(vm.candidate.graduationYear) || 
      vm.candidate.graduationYear < 1950 || 
      vm.candidate.graduationYear > new Date().getFullYear()) {
      vm.validationErrors.push('Graduation Year must be a valid year');
    }
    
    // Language of Education
    if (!vm.candidate.languageOfEducation || vm.candidate.languageOfEducation.trim() === '') {
      vm.validationErrors.push('Language of Education is required');
    }
  };

  // Validation for Proficiency section
  vm.validateProficiencySection = function() {
    // Must have at least one English proficiency indicator
    if (!vm.candidate.proofOfEnglishProficiency && 
        !vm.candidate.englishExamExpiredOrExceededMinimumRequirement && 
        !vm.candidate.activeUseOfEnglish) {
      vm.validationErrors.push('At least one English proficiency criterion must be met');
    }
  };

  // Validation for Exams section
  vm.validateExamsSection = function() {
    // NAC Exam Date
    if (!vm.candidate.nacDate) {
      vm.validationErrors.push('NAC Exam Date is required');
    }
    
    // MCCQE1 Exam Date
    if (!vm.candidate.mccqe1Date) {
      vm.validationErrors.push('MCCQE1 Exam Date is required');
    }
    
    // MCCQE2 Exam Date
    if (!vm.candidate.mccqe2Date) {
      vm.validationErrors.push('MCCQE2 Exam Date is required');
    }
  };

  // Initialize controller
  vm.init();
});