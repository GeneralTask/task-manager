import { useLayoutEffect } from 'react'

// duration in seconds
export default function useInterval(func: () => void, seconds: number, callFuncImmediately = true): void {
    useLayoutEffect(() => {
        if (callFuncImmediately) func()
        const interval = setInterval(func, seconds * 1000)
        return () => clearInterval(interval)
    }, [func, seconds])
}
