import { TTask } from './types'
import getEnvVars from '../environment'

const { REACT_APP_FRONTEND_BASE_URL } = getEnvVars()

export const getHeaders = (): Record<string, string> => {
    const date = new Date()
    return {
        'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
        'Access-Control-Allow-Headers':
            'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
        'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
        'Timezone-Offset': date.getTimezoneOffset().toString(),
    }
}

export function resetOrderingIds(tasks: TTask[]) {
    for (let i = 1; i < tasks.length; i++) {
        tasks[i].id_ordering = i
    }
}

// https://github.com/sindresorhus/array-move/blob/main/index.js
export function arrayMoveInPlace<T>(array: Array<T>, fromIndex: number, toIndex: number) {
    const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

    if (startIndex >= 0 && startIndex < array.length) {
        const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

        const [item] = array.splice(fromIndex, 1);
        array.splice(endIndex, 0, item);
    }
}

