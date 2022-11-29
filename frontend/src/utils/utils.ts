import { Immutable } from 'immer'
import { DateTime } from 'luxon'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../constants'
import KEYBOARD_SHORTCUTS from '../constants/shortcuts'
import { TIconColor, TTextColor } from '../styles/colors'
import { TLinkedAccount, TTask, TTaskSection, TTaskV4 } from './types'

// https://github.com/sindresorhus/array-move/blob/main/index.js
export function arrayMoveInPlace<T>(array: Array<T>, fromIndex: number, toIndex: number) {
    const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex

    if (startIndex >= 0 && startIndex < array.length) {
        const endIndex = toIndex < 0 ? array.length + toIndex : toIndex

        const [item] = array.splice(fromIndex, 1)
        array.splice(endIndex, 0, item)
    }
}

export function resetOrderingIds(tasks: { id_ordering: number }[]) {
    for (let i = 0; i < tasks.length; i++) {
        tasks[i].id_ordering = i + 1
    }
}

export const getHumanTimeSinceDateTime = (date: DateTime) => {
    const { years, months, days, hours, minutes } = DateTime.now().diff(date, [
        'years',
        'months',
        'days',
        'hours',
        'minutes',
        'milliseconds',
    ])

    if (years > 0) {
        return `${years} ${years > 1 ? 'years' : 'year'} ago`
    } else if (months > 0) {
        return `${months} ${months > 1 ? 'months' : 'month'} ago`
    } else if (days > 0) {
        return `${days} ${days > 1 ? 'days' : 'day'} ago`
    } else if (hours > 0) {
        return `${hours} ${hours > 1 ? 'hours' : 'hour'} ago`
    } else if (minutes > 0) {
        return `${minutes} ${minutes > 1 ? 'mins' : 'min'} ago`
    }
    return `just now`
}
export const isGithubLinked = (linkedAccounts: TLinkedAccount[]) => {
    return linkedAccounts.some((account) => account.name === 'GitHub')
}
export const isGoogleCalendarLinked = (linkedAccounts: TLinkedAccount[]) => {
    return linkedAccounts.some((account) => account.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)
}
export const isSlackLinked = (linkedAccounts: TLinkedAccount[]) => {
    return linkedAccounts.some((account) => account.name === 'Slack')
}
export const isLinearLinked = (linkedAccounts: TLinkedAccount[]) => {
    return linkedAccounts.some((account) => account.name === 'Linear')
}

export const doesAccountNeedRelinking = (linkedAccounts: TLinkedAccount[], accountName: string) => {
    return linkedAccounts
        .filter((linkedAccount) => linkedAccount.name === accountName)
        .some((account) => account.has_bad_token)
}

export const getHumanDateTime = (date: DateTime) => {
    const { days } = DateTime.now().endOf('day').diff(date, ['milliseconds', 'days'])

    if (days === 0) {
        return date.toLocaleString({ hour12: true, hour: 'numeric', minute: 'numeric' })
    } else if (days === 1) {
        return 'Yesterday'
    }
    return date.toLocaleString({ month: 'numeric', day: 'numeric', year: '2-digit' })
}

// to avoid creating empty placeholder functions across the app
export const emptyFunction = () => void 0

export const countWithOverflow = (count: number, max = 99) => {
    if (count > max) {
        return `${max}+`
    }
    return `${count}`
}

interface TGetTaskIndexFromSectionsReturnType {
    taskIndex?: number
    sectionIndex?: number
    subtaskIndex?: number
}
export const getTaskIndexFromSections = (
    sections: Immutable<{ id?: string; tasks: TTask[] }[]>,
    taskId: string,
    sectionId?: string,
    subtaskId?: string
): TGetTaskIndexFromSectionsReturnType => {
    const invalidResult = { taskIndex: undefined, sectionIndex: undefined }
    if (sectionId) {
        const sectionIndex = sections.findIndex((section) => section.id === sectionId)
        if (sectionIndex === -1) return invalidResult
        const taskIndex = sections[sectionIndex].tasks.findIndex((task) => task.id === taskId)
        if (taskIndex === -1) return invalidResult
        const subtaskIndex = sections[sectionIndex].tasks[taskIndex]?.sub_tasks?.findIndex(
            (subtask) => subtask.id === subtaskId
        )
        return { taskIndex, sectionIndex, subtaskIndex }
    } else {
        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
            const section = sections[sectionIndex]
            for (let taskIndex = 0; taskIndex < section.tasks.length; taskIndex++) {
                const task = section.tasks[taskIndex]
                if (task.id === taskId) {
                    if (subtaskId) {
                        const subtaskIndex = sections[sectionIndex].tasks[taskIndex]?.sub_tasks?.findIndex(
                            (subtask) => subtask.id === subtaskId
                        )
                        return { taskIndex, sectionIndex, subtaskIndex }
                    }
                    return { taskIndex, sectionIndex }
                }
            }
        }
    }
    return invalidResult
}

export const getTaskFromSections = (
    sections: TTaskSection[],
    taskId: string,
    sectionId?: string
): TTask | undefined => {
    const { taskIndex, sectionIndex } = getTaskIndexFromSections(sections, taskId, sectionId)
    if (taskIndex === undefined || sectionIndex === undefined) return undefined
    return sections[sectionIndex].tasks[taskIndex]
}

export const getSectionFromTask = (sections: TTaskSection[], taskId: string): TTaskSection | undefined => {
    const { taskIndex, sectionIndex } = getTaskIndexFromSections(sections, taskId)
    if (taskIndex === undefined || sectionIndex === undefined) return undefined
    return sections[sectionIndex]
}

export const getKeyCode = (e: KeyboardEvent | React.KeyboardEvent): string => {
    let keyName = ''
    if (e.ctrlKey) {
        keyName += 'Ctrl+'
    }
    if (e.metaKey) {
        keyName += 'Meta+'
    }
    if (e.shiftKey) {
        keyName += 'Shift+'
    }
    return keyName + e.key
}

// calls e.stopPropogation() unless the key is a listed extension or ⌘K
export const stopKeydownPropogation = (
    e: KeyboardEvent | React.KeyboardEvent,
    exceptions: string[] = [],
    disableCommandPalette?: boolean
) => {
    const key = getKeyCode(e)
    if (!disableCommandPalette) {
        exceptions.push(KEYBOARD_SHORTCUTS.toggleCommandPalette.key)
    }
    if (!exceptions.includes(key)) {
        e.stopPropagation()
    }
}

export const getFormattedDate = (
    date: Date | null
): {
    dateString: string
    textColor: TTextColor
    iconColor: TIconColor
} => {
    if (!date || !isValidDueDate(date)) {
        return { dateString: 'No due date', textColor: 'light', iconColor: 'gray' }
    }
    if (DateTime.fromJSDate(date).hasSame(DateTime.local(), 'day')) {
        return { dateString: 'Today', textColor: 'red', iconColor: 'red' }
    }
    if (DateTime.fromJSDate(date).hasSame(DateTime.local().plus({ days: 1 }), 'day')) {
        return { dateString: 'Tomorrow', textColor: 'orange', iconColor: 'orange' }
    }
    if (DateTime.fromJSDate(date) < DateTime.local()) {
        return {
            dateString: `Overdue (${DateTime.fromJSDate(date).toFormat('LLL dd')})`,
            textColor: 'red',
            iconColor: 'red',
        }
    }
    if (!DateTime.fromJSDate(date).hasSame(DateTime.local(), 'year')) {
        return { dateString: DateTime.fromJSDate(date).toFormat('LLL dd yyyy'), textColor: 'light', iconColor: 'gray' }
    }
    return { dateString: DateTime.fromJSDate(date).toFormat('LLL dd'), textColor: 'light', iconColor: 'gray' }
}

export const isValidDueDate = (date: Date | null) => {
    return !(!date || isNaN(+date) || +date === 0)
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const createNewTaskHelper = (data: Partial<TTask> & { optimisticId: string; title: string }): TTask => {
    return {
        id: data.optimisticId,
        optimisticId: data.optimisticId,
        id_ordering: data.id_ordering ?? 0.5,
        title: data.title,
        body: data.body ?? '',
        deeplink: data.deeplink ?? '',
        sent_at: data.sent_at ?? '',
        priority_normalized: data.priority_normalized ?? 0,
        time_allocated: data.time_allocated ?? 0,
        due_date: data.due_date ?? '',
        source: data.source ?? {
            name: 'General Task',
            logo: '',
            logo_v2: 'generaltask',
            is_completable: false,
            is_replyable: false,
        },
        sender: data.sender ?? '',
        is_done: data.is_done ?? false,
        is_deleted: data.is_deleted ?? false,
        is_meeting_preparation_task: data.is_meeting_preparation_task ?? false,
        nux_number_id: data.nux_number_id ?? 0,
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? '',
    }
}
export const createNewTaskV4Helper = (data: Partial<TTaskV4> & { optimisticId: string; title: string }): TTaskV4 => {
    return {
        id: data.optimisticId,
        optimisticId: data.optimisticId,
        id_ordering: data.id_ordering ?? 0.5,
        title: data.title,
        deeplink: data.deeplink ?? '',
        body: data.body ?? '',
        priority_normalized: data.priority_normalized ?? 0,
        due_date: data.due_date ?? '',
        source: data.source ?? {
            name: 'General Task',
            logo: '',
            logo_v2: 'generaltask',
            is_completable: false,
            is_replyable: false,
        },
        is_done: data.is_done ?? false,
        is_deleted: data.is_deleted ?? false,
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? '',
        id_folder: data.id_folder ?? '',
        id_nux_number: data.id_nux_number,
        id_parent: data.id_parent,
        subtask_ids: data.subtask_ids,
        meeting_preparation_params: data.meeting_preparation_params,
        slack_message_params: data.slack_message_params,
        sender: data.sender ?? '',
        comments: data.comments,
        external_status: data.external_status,
        all_statuses: data.all_statuses,
    }
}
