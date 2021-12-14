import { FetchStatusEnum } from '../redux/enums'

export enum NavbarPages {
    TASKS_PAGE = 'task_page',
    SETTINGS_PAGE = 'settings_page',
    LOGOUT = 'logout'
}
export enum TTaskGroupType {
    SCHEDULED_TASK = 'scheduled_task',
    UNSCHEDULED_GROUP = 'unscheduled_group',
}

export interface TTaskSource {
    name: string,
    logo: string,
    is_completable: boolean,
    is_replyable: boolean,
}

export interface TConferenceCall {
    platform: string,
    logo: string,
    url: string,
}

export interface TTask {
    id: string,
    id_external: string,
    id_ordering: number,
    datetime_end: string | null,
    datetime_start: string | null,
    deeplink: string | null,
    sender: string | null,
    title: string,
    source: TTaskSource
    body: string | null
    conference_call: TConferenceCall | null,
    emailSender: string | null,
    emailSentTime: string | null,
}

export interface TTaskGroup {
    type: TTaskGroupType,
    time_duration: number,
    datetime_start: string | null,
    tasks: TTask[]
}

export interface TTaskSection {
    id: string,
    name: string,
    is_today: boolean,
    task_groups: TTaskGroup[],
}

export interface TSettingChoice {
    choice_key: string,
    choice_name: string,
}

export interface TSetting {
    field_key: string,
    field_value: string,
    field_name: string,
    choices: TSettingChoice[],
}

export interface TLinkedAccount {
    id: string,
    display_id: string,
    name: string,
    logo: string,
    is_unlinkable: boolean
}

export interface Indices {
    task: number,
    group: number,
    section: number,
}

// React-DND Item Types
export const ItemTypes = {
    TASK: 'task'
}

export interface DropResult {
    id: string,
    dropDisabled: boolean
}

export interface TFetchStatus {
    status: FetchStatusEnum,
    abort_fetch: () => void,
}

export interface TTaskCreateParams {
    account_id?: string,
    title: string,
    body?: string,
    due_date?: string,
    time_duration?: number,
}
