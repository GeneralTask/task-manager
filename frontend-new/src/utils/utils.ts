import { TTask } from "./types";
import { useEffect } from "react";

// https://github.com/sindresorhus/array-move/blob/main/index.js
export function arrayMoveInPlace<T>(array: Array<T>, fromIndex: number, toIndex: number) {
    const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

    if (startIndex >= 0 && startIndex < array.length) {
        const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

        const [item] = array.splice(fromIndex, 1);
        array.splice(endIndex, 0, item);
    }
}

export function resetOrderingIds(tasks: TTask[]) {
    for (let i = 1; i < tasks.length; i++) {
        tasks[i].id_ordering = i
    }
}

// duration in seconds
export function useInterval(func: () => void, seconds: number, callFuncImmediately = true): void {
    useEffect(() => {
        if (callFuncImmediately) func()
        const interval = setInterval(func, seconds * 1000)
        return () => clearInterval(interval)
    }, [func, seconds])
}
