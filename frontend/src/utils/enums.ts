export enum CompanyPolicyPages {
    TermsOfService,
    PrivacyPolicy,
}

// matches enum in backend/api/recurring_task_template_backfill.go
export enum RecurrenceRate {
    DAILY = 0,
    WEEK_DAILY = 1,
    WEEKLY = 2,
    MONTHLY = 3,
    YEARLY = 4,
}
