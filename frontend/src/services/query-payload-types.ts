
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

export { TCreateEventPayload }
