import { TEmailThread, TRecipients } from "../utils/types"

interface TEventAttendee {
    name: string
    email: string
}
interface TCreateEventPayload {
    account_id: string
    datetime_start: string
    datetime_end: string
    summary?: string
    location?: string
    description?: string
    time_zone?: string
    attendees?: TEventAttendee[]
    add_conference_call?: boolean
}
interface TEmailThreadResponse {
    pages: TEmailThread[][]
}
interface TTaskModifyRequestBody {
    id_task_section?: string
    id_ordering?: number
    title?: string
    due_date?: string
    time_duration?: number
    body?: string
}
interface TAddTaskSectionData {
    name: string
}
interface TPostFeedbackData {
    feedback: string
}
interface TCreateTaskData {
    title: string
    body: string
    id_task_section: string
}
interface TCreateTaskResponse {
    task_id: string
}
interface TModifyTaskData {
    id: string
    title?: string
    dueDate?: string
    timeAllocated?: number
    body?: string
}
interface TMarkTaskDoneData {
    taskId: string
    isCompleted: boolean
}
interface TReorderTaskData {
    taskId: string
    dropSectionId: string
    orderingId: number
    dragSectionId?: string
}
interface TModifyTaskSectionData {
    sectionId: string
    name: string
}
interface TMarkAsTaskData {
    id: string
    isTask: boolean
}
interface TMarkMessageReadData {
    id: string
    isRead: boolean
}
interface TComposeMessageData {
    message_id?: string
    subject?: string
    body: string
    recipients: TRecipients
    source_id: string
    source_account_id: string
}
interface TCreateTaskFromThreadData {
    thread_id: string
    title: string
    body: string
    email_id?: string
}

interface TModifyThreadData {
    thread_id: string
    is_unread: boolean
}

export {
    TCreateEventPayload,
    TEmailThreadResponse,
    TTaskModifyRequestBody,
    TAddTaskSectionData,
    TPostFeedbackData,
    TCreateTaskData,
    TCreateTaskResponse,
    TModifyTaskData,
    TMarkTaskDoneData,
    TReorderTaskData,
    TModifyTaskSectionData,
    TMarkAsTaskData,
    TMarkMessageReadData,
    TComposeMessageData,
    TCreateTaskFromThreadData,
    TModifyThreadData
}
