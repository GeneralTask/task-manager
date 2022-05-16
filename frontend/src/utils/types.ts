import { EmailComposeType } from "./enums"

export type Datestring = string

export interface TTaskSource {
    name: string
    logo: string
    logo_v2: string
    is_completable: boolean
    is_replyable: boolean
}

export interface TConferenceCall {
    platform: string
    logo: string
    url: string
}

export interface TSender {
    name: string
    email: string
    reply_to: string
}

export interface TRecipients {
    to: TRecipient[]
    cc: TRecipient[]
    bcc: TRecipient[]
}

export interface TRecipient {
    name: string
    email: string
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
    logo_v2: string
    is_completable: boolean // Whether to show the done button
    is_replyable: boolean // Whether to show the reply button
}

export interface TMessage {
    id: string
    title: string
    deeplink: string
    body: string
    sender: string
    sender_v2: TSender
    recipients: TRecipients
    sent_at: string
    is_unread: boolean
    is_task: boolean
    source: TMessageSource
}

export interface TMessageResponse {
    pages: TMessage[][]
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

export interface TMeetingBanner {
    title: string
    subtitle: string
    events: TMeetingEvent[]
    actions: TMeetingAction[]
}

export interface TMeetingEvent {
    title: string
    meeting_link: string | null
}

export interface TMeetingAction {
    logo: string
    title: string
    link: string
}

export interface TEmail {
    message_id: string
    subject: string
    body: string
    sent_at: string
    is_unread: boolean
    sender: TSender
    recipients: TRecipients
}

export interface TEmailThread {
    id: string
    is_task: boolean
    deeplink: string
    source: TMessageSource
    emails: TEmail[]
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

export interface TSupportedType {
    name: string
    logo: string
    logo_v2: string
    authorization_url: string
}
export interface TLinkedAccount {
    id: string
    display_id: string
    name: string
    logo: string
    logo_v2: string
    is_unlinkable: boolean
    has_bad_token: boolean
}

// React-DND Item Types
export const ItemTypes = {
    TASK: 'task',
}

export interface DropResult {
    id: string
    dropDisabled: boolean
}
export interface DropProps {
    id: string
    taskIndex: number
    sectionId: string
}

export interface TTaskCreateParams {
    account_id?: string
    title: string
    body?: string
    due_date?: string
    time_duration?: number
    id_task_section?: string
}

export interface TUserInfo {
    agreed_to_terms: boolean
    opted_into_marketing: boolean
}

export interface TEmailComposeState {
    emailComposeType: EmailComposeType | null
    emailId: string | null // the id of the email to show the compose form for
    undoTimeout?: NodeJS.Timeout
}
