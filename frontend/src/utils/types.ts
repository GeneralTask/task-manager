import { EmailComposeType } from "./enums"
import { TPullRequestStatusColors } from "../components/pull-requests/styles"
import { TLogoImage } from "../styles/images"

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
    external_status?: TExternalStatus
    source: TTaskSource
    sender: string
    recipients: TRecipients
    is_done: boolean
    linked_email_thread?: TLinkedEmailThread
    comments?: TLinearComment[]
    isOptimistic?: boolean
}

export interface TLinearComment {
    body: string
    created_at: string
    user: TLinearUser
}

export interface TLinearUser {
    DisplayName: string
    Email: string
    ExternalID: string
    Name: string
}

export interface TExternalStatus {
    state: string // the custom name of the status (e.g. Todo) - note: these are self-defined by the users of linear and can be different even across teams
    type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' // the type of status native to the task application
}

export interface TLinkedEmailThread {
    linked_thread_id: string
    linked_email_id?: string
    email_thread: TEmailThread
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
    conference_call: TConferenceCall
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
    num_attachments: number
}

export interface TEmailThread {
    id: string
    deeplink: string
    source: TMessageSource
    is_archived: boolean
    emails: TEmail[]
}

// Pull Request Types
export interface TPullRequest {
    id: string
    title: string
    number: number
    status: {
        text: string
        color: TPullRequestStatusColors
    }
    author: string
    num_comments: number
    created_at: string
    branch: string
    link: string
}

export interface TRepository {
    id: string
    name: string
    pull_requests: TPullRequest[]
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
export enum DropType {
    TASK = 'task',
    OVERVIEW_VIEW = 'overview-view',
}

export interface DropItem {
    id: string
    sectionId: string
    task: TTask
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
    isPending?: boolean
}

export type TMailbox = 'inbox' | 'archive'

export type TOverviewItem = TTask // TODO: change this to more general type
export interface TOverviewView {
    id: string
    name: string
    type: 'github' | 'task_section' | 'linear' | 'message' | 'slack'
    section_id?: string
    is_paginated: boolean
    is_reorderable: boolean
    logo: TLogoImage
    view_items: TOverviewItem[]
}

export interface TSupportedOverviewView {
    id: string
    name: string
    logo: TLogoImage
    is_added: boolean
}
