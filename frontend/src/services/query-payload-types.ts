import { TEmailThread } from "../utils/types"

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

export {
    TCreateEventPayload,
    TEmailThreadResponse,
    TTaskModifyRequestBody,
    TAddTaskSectionData,
    TPostFeedbackData,
    TCreateTaskData,
}
