import { DateTime } from 'luxon';
import { TTask } from './types'
import sanitizeHtml from 'sanitize-html'

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
    const strsToReplace = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': '\'',
    }
    const sanitized = sanitizeHtml(dirtyHTML, {
        allowedTags: [],
        allowedAttributes: {},
    })
    return replaceBulk(sanitized, strsToReplace)
}

export const getHumanTimeSinceDateTime = (date: DateTime) => {
    const { years, months, days, hours, minutes } = DateTime.now().diff(date, ['years', 'months', 'days', 'hours', 'minutes', 'milliseconds'])

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

// https://stackoverflow.com/a/46181/12679075
export const isValidEmail = (email: string): boolean =>
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email.toLowerCase())

// Inspired by https://stackoverflow.com/questions/5069464/replace-multiple-strings-at-once
function replaceBulk(str: string, findReplaceMap: { [key: string]: string }) {
    const regexArr: string[] = []
    for (const find of Object.keys(findReplaceMap)) {
        regexArr.push(find.replace(/([-[\]{}()*+?.\\^$|#,])/g, '\\$1'))
    }
    const regex = regexArr.join('|')
    return str.replace(new RegExp(regex, 'g'), function (matched) {
        return findReplaceMap[matched]
    })
}
