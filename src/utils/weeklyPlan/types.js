/**
 * @typedef {'normal' | 'examWeek' | 'cram' | 'keepSharp'} PlanMode
 */

/**
 * @typedef {'learningGuide' | 'practiceQuiz' | 'flashcardSet' | 'feynman' | 'freeRecall'} ModuleActivityType
 */

/**
 * @typedef {Object} PlanAssignment
 * @property {string} [journeyId]
 * @property {string} [journeyTitle]
 * @property {string|null} [moduleId]
 * @property {string} moduleName
 * @property {string} [moduleAbbr]
 * @property {number|null} [moduleNumber]
 * @property {string} activityId
 * @property {ModuleActivityType|string} activityType
 * @property {string} reasonCode
 * @property {number} [estimatedMin]
 * @property {string} [prescriptionType]
 * @property {string|null} [primaryMode]
 * @property {string|null} [prescriptionSummary]
 * @property {object|null} [prescription]
 * @property {object|null} [quizConfig]
 * @property {string|null} [flashcardMode]
 * @property {boolean} [mixedPhrasing]
 * @property {boolean} [timed]
 * @property {boolean} [prescriptionDriven]
 * @property {boolean} [journeyLevel]
 * @property {object} [rationale]
 */

/**
 * @typedef {Object} PlanDay
 * @property {number} dayIndex - 0=Mon … 6=Sun
 * @property {string} dateKey - YYYY-MM-DD
 * @property {number} estimatedMin
 * @property {PlanAssignment[]} assignments
 * @property {number} fsrsCardCount
 * @property {boolean} isRestDay
 * @property {number} [dayBudgetMin]
 * @property {Record<string, number>} [fsrsByJourney]
 */

/**
 * @typedef {Object} ModuleSummary
 * @property {string} moduleId
 * @property {string} moduleName
 * @property {string} priorityText
 * @property {number[]} assignedDayIndexes
 * @property {string[]} weakConceptLabels
 * @property {string} [reasonCode]
 */

/**
 * @typedef {Object} PlanTrustFactor
 * @property {string} id
 * @property {string} label
 * @property {string} value
 * @property {string} [detail]
 * @property {'high'|'medium'|'low'} [weight]
 */

/**
 * @typedef {Object} WeeklyPlanSnapshot
 * @property {PlanMode} mode
 * @property {string} weekKey
 * @property {number} builtAt
 * @property {number} dailyBudgetMin
 * @property {number|null} daysUntilExam
 * @property {PlanDay[]} days
 * @property {ModuleSummary[]} moduleSummaries
 * @property {string} [weekStrategy]
 * @property {PlanTrustFactor[]} [trustFactors]
 * @property {object} [studyBudgetTier]
 * @property {string[]} [journeyIds]
 * @property {Record<string, PlanMode>} [journeyModesById]
 */

/**
 * @typedef {Object} ModuleContext
 * @property {object} module
 * @property {string} stage
 * @property {boolean} guideComplete
 * @property {boolean} guideInProgress
 * @property {number|null} quizAccuracy
 * @property {number|null} daysSinceLastQuiz
 * @property {string[]} weakConceptLabels
 * @property {object|null} learningGuideActivity
 * @property {object|null} practiceQuizActivity
 * @property {object|null} flashcardActivity
 * @property {object|null} feynmanActivity
 * @property {object|null} freeRecallActivity
 * @property {number} urgencyScore
 */

export {};
