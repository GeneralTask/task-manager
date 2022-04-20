import sanitizeHtml from 'sanitize-html'
import { TTask } from './types'
import { DateTime } from 'luxon';

// https://github.com/sindresorhus/array-move/blob/main/index.js
export function arrayMoveInPlace<T>(array: Array<T>, fromIndex: number, toIndex: number) {
    const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex

    if (startIndex >= 0 && startIndex < array.length) {
        const endIndex = toIndex < 0 ? array.length + toIndex : toIndex

        const [item] = array.splice(fromIndex, 1)
        array.splice(endIndex, 0, item)
    }
}

export function resetOrderingIds(tasks: TTask[]) {
    for (let i = 1; i < tasks.length; i++) {
        tasks[i].id_ordering = i
    }
}

export const removeHTMLTags = (dirtyHTML: string) => {
    return sanitizeHtml(dirtyHTML, {
        allowedTags: [],
        allowedAttributes: {},
    })
}

export const timeSince = (date: DateTime) => {
    const now = DateTime.now()
    const diff = now.diff(date, ['years', 'months', 'days', 'hours', 'minutes', 'milliseconds'])
    const years = diff.years
    const months = diff.months
    const days = diff.days
    const hours = diff.hours
    const minutes = diff.minutes

    if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} ago`
    } else if (months > 0) {
        return `${months} month${months > 1 ? 's' : ''} ago`
    } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
        return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    } else {
        return `just now`
    }
}

// to avoid creating empty placeholder functions across the app
export const emptyFunction = () => void 0
