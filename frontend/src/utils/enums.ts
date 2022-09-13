export enum FetchStatusEnum {
    LOADING,
    SUCCESS,
    ERROR,
}

export enum AbortID {
    TASKS,
    EVENTS,
    LINKED_ACCOUNTS,
    SETTINGS,
}

export enum LogEvents {
    TASK_CREATED = 'task_created',
    TASK_EXPANDED = 'task_expanded',
    TASK_COLLAPSED = 'task_collapased',
    TASK_REORDERED = 'task_reordered',
    TASK_MARK_AS_DONE = 'task_mark_as_done',
    SHOW_TASK_CREATE_FORM = 'show_task_create_form',
    HIDE_TASK_CREATE_FORM = 'hide_task_create_form',
    TASK_DEEPLINK_CLICKED = 'deeplink_clicked',
    // for when the refresh spinner is clicked by the user
    MANUAL_TASKS_REFRESH_CLICK = 'manual_tasks_refresh_click',
}

export enum CompanyPolicyPages {
    TermsOfService,
    PrivacyPolicy,
}

export enum SORT_DIRECTION {
    ASC = 'asc',
    DESC = 'desc',
}
