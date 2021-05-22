export interface Task {
    id: string,
    id_external: string,
    id_ordering: number,
    datetime_end: string | null,
    datetime_start: string | null,
    deeplink: string | null,
    sender: string | null,
    logo_url: string,
    title: string,
    source: string,
    is_completable: boolean,
    body: string | null
}

export interface TaskGroup {
    type: string,
    time_duration: number,
    datetime_start: string | null,
    tasks: Task[]
}
