export interface TTaskSource {
    name: string,
    logo: string,
    is_completable: boolean,
    is_replyable: boolean,
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
}

export interface TTaskGroup {
    type: string,
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

export interface LinkedAccount {
    id: string,
    display_id: string,
    name: string,
    logo: string,
    is_unlinkable: boolean
}
