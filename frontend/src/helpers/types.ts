export type Datestring = string

export interface TTaskSource {
    name: string
    logo: string
    is_completable: boolean
    is_replyable: boolean
}

export interface TConferenceCall {
    platform: string
    logo: string
    url: string
}

export interface TRecipient {
    name: string
    email: string
}

export interface TRecipients {
    to: TRecipient[]
    cc: TRecipient[]
    bcc: TRecipient[]
}

export interface TTask {
    id: string
    id_ordering: number
    title: string
    deeplink: string
    body: string
    sent_at: string
    time_allocated: number
    due_date: string
    source: TTaskSource
    sender: string
    recipients: TRecipients
    is_done: boolean
}

export interface TMessageSource {
    account_id: string // Account ID for the message (eg. Recipient email address)
    name: string // Human readable name of the source
    logo: string // Relative URL to the logo to display
    is_completable: boolean // Whether to show the done button
    is_replyable: boolean // Whether to show the reply button
}

export interface TMessage {
    id: string
    title: string
    deeplink: string
    body: string
    sender: string
    recipients: TRecipients
    sent_at: string
    is_unread: boolean
    source: TMessageSource
}

export interface TEvent {
    id: string
    title: string
    body: string
    deeplink: string
    datetime_start: string
    datetime_end: string
    conference_call: TConferenceCall | null
}

export interface TTaskSection {
    id: string
    name: string
    tasks: TTask[]
    is_done: boolean
}

export interface TSettingChoice {
    choice_key: string
    choice_name: string
}

export interface TSetting {
    field_key: string
    field_value: string
    field_name: string
    choices: TSettingChoice[]
}

export interface TLinkedAccount {
    id: string
    display_id: string
    name: string
    logo: string
    is_unlinkable: boolean
}

export interface Indices {
    task: number
    section: number
}

// React-DND Item Types
export const ItemTypes = {
    TASK: 'task',
}

export interface DropResult {
    id: string
    dropDisabled: boolean
}

export interface TTaskCreateParams {
    account_id?: string
    title: string
    body?: string
    due_date?: string
    time_duration?: number
    id_task_section?: string
}

export interface SelectionInfo {
    id: string | null
    show_keyboard_indicator: boolean
    is_body_expanded: boolean
}
