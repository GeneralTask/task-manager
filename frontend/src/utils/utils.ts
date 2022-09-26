import { Immutable } from 'immer'
import { DateTime } from 'luxon'
import { TLinkedAccount, TTask, TTaskFolder } from './types'
import KEYBOARD_SHORTCUTS from '../constants/shortcuts';

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
    for (let i = 1; i < tasks.length; i++) {
        tasks[i].id_ordering = i
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

interface TGetTaskIndexFromFoldersReturnType {
    taskIndex?: number
    folderIndex?: number
}
export const getTaskIndexFromFolders = (
    folders: Immutable<{ id?: string; tasks: TTask[] }[]>,
    taskId: string,
    folderId?: string
): TGetTaskIndexFromFoldersReturnType => {
    const invalidResult = { taskIndex: undefined, folderIndex: undefined }
    if (folderId) {
        const folderIndex = folders.findIndex((folder) => folder.id === folderId)
        if (folderIndex === -1) return invalidResult
        const taskIndex = folders[folderIndex].tasks.findIndex((task) => task.id === taskId)
        if (taskIndex === -1) return invalidResult
        return { taskIndex, folderIndex }
    } else {
        for (let folderIndex = 0; folderIndex < folders.length; folderIndex++) {
            const folder = folders[folderIndex]
            for (let taskIndex = 0; taskIndex < folder.tasks.length; taskIndex++) {
                const task = folder.tasks[taskIndex]
                if (task.id === taskId) {
                    return { taskIndex, folderIndex }
                }
            }
        }
    }
    return invalidResult
}

export const getTaskFromFolders = (
    folders: TTaskFolder[],
    taskId: string,
    folderId?: string
): TTask | undefined => {
    const { taskIndex, folderIndex } = getTaskIndexFromFolders(folders, taskId, folderId)
    if (taskIndex === undefined || folderIndex === undefined) return undefined
    return folders[folderIndex].tasks[taskIndex]
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
export const stopKeydownPropogation = (e: KeyboardEvent | React.KeyboardEvent, exceptions: string[] = []) => {
    const key = getKeyCode(e)
    exceptions.push(KEYBOARD_SHORTCUTS.toggleCommandPalette.key)
    if (!exceptions.includes(key)) {
        e.stopPropagation()
    }
}
export const isGithubLinkedAccount = (linkedAccounts: TLinkedAccount[]) =>
    linkedAccounts.some((account) => account.name === 'Github')
