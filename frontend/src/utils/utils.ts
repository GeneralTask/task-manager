import { Immutable } from 'immer'
import { DateTime, Duration, DurationUnit } from 'luxon'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../constants'
import KEYBOARD_SHORTCUTS from '../constants/shortcuts'
import { TIconColor, TTextColor } from '../styles/colors'
import { TLinkedAccount, TLinkedAccountName, TTask, TTaskSection } from './types'

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
export const doesAccountNeedRelinking = (linkedAccounts: TLinkedAccount[], accountName: TLinkedAccountName) => {
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

// provides a constant reference in case this is passed into a dependecy array
export const EMPTY_ARRAY = []

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

export const getSubtaskFromSections = (
    sections: TTaskSection[],
    parentId: string,
    subtaskId: string
): TTask | undefined => {
    const { taskIndex, sectionIndex, subtaskIndex } = getTaskIndexFromSections(sections, parentId, undefined, subtaskId)
    if (taskIndex === undefined || sectionIndex === undefined || subtaskIndex === undefined) return undefined
    return sections[sectionIndex].tasks[taskIndex].sub_tasks?.[subtaskIndex]
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

export const getFolderIdFromTask = (folders: TTaskSection[], taskId: string): string | undefined => {
    for (const folder of folders) {
        for (const task of folder.tasks) {
            if (task.id === taskId) {
                return folder.id
            }
        }
    }
    return undefined
}

export const getKeyCode = (e: KeyboardEvent | React.KeyboardEvent): string => {
    let keyName = ''
    if (e.ctrlKey) {
        keyName += 'Ctrl+'
    }
    if (e.metaKey) {
        keyName += 'Meta+'
    }
    if (e.altKey) {
        keyName += 'Alt+'
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
    const allExceptions = [...exceptions.map((e) => e.split('|')).flat()]
    if (!disableCommandPalette) {
        allExceptions.push(KEYBOARD_SHORTCUTS.toggleCommandPalette.key)
    }
    if (!allExceptions.includes(key)) {
        e.stopPropagation()
    }
}

export const getFormattedDate = (
    date: DateTime | null,
    isDoneOrDeleted?: boolean
): {
    dateString: string
    textColor: TTextColor
    iconColor: TIconColor
} => {
    // Empty due dates are represented using 0 epoch time
    if (!date || !date.isValid || +date === 0) {
        return { dateString: 'No due date', textColor: 'light', iconColor: 'gray' }
    }
    if (date.hasSame(DateTime.local(), 'day')) {
        if (isDoneOrDeleted) {
            return { dateString: 'Today', textColor: 'light', iconColor: 'gray' }
        }
        return { dateString: 'Today', textColor: 'red', iconColor: 'red' }
    }
    if (date.hasSame(DateTime.local().plus({ days: 1 }), 'day')) {
        if (isDoneOrDeleted) {
            return { dateString: 'Tomorrow', textColor: 'light', iconColor: 'gray' }
        }
        return { dateString: 'Tomorrow', textColor: 'orange', iconColor: 'orange' }
    }
    if (date < DateTime.local()) {
        if (isDoneOrDeleted) {
            return {
                dateString: `${date.toFormat('LLL dd')}`,
                textColor: 'light',
                iconColor: 'gray',
            }
        }
        return {
            dateString: `Overdue (${date.toFormat('LLL dd')})`,
            textColor: 'red',
            iconColor: 'red',
        }
    }
    if (!date.hasSame(DateTime.local(), 'year')) {
        return { dateString: date.toFormat('LLL dd yyyy'), textColor: 'light', iconColor: 'gray' }
    }
    return { dateString: date.toFormat('LLL dd'), textColor: 'light', iconColor: 'gray' }
}
export const getFormattedDuration = (duration: Duration, maxUnits?: number) => {
    const allUnits: DurationUnit[] = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']
    const newDuration = duration.rescale()
    if (!maxUnits) return newDuration.toHuman({ maximumFractionDigits: 0 })
    for (const [index, unit] of allUnits.entries()) {
        if (newDuration.get(unit) !== 0) {
            const units = allUnits.slice(index, index + maxUnits)
            const lowestUnit = index + maxUnits - 1 >= allUnits.length ? 'seconds' : allUnits[index + maxUnits - 1]
            return newDuration
                .minus({ [lowestUnit]: 0.5 })
                .shiftTo(...units)
                .toHuman({ maximumFractionDigits: 0 })
        }
    }
    return newDuration.shiftTo('seconds').toHuman({ maximumFractionDigits: 0 })
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
