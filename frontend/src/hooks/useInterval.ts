import { useLayoutEffect } from 'react'

// duration in ms
export default function useInterval(func: () => void, ms: number, callFuncImmediately = true): void {
    useLayoutEffect(() => {
        if (callFuncImmediately) func()
        const interval = setInterval(func, ms)
        return () => clearInterval(interval)
    }, [func, ms])
}
