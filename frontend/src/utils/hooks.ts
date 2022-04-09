import React, { useEffect } from "react"

// duration in seconds
export function useInterval(func: () => void, seconds: number, callFuncImmediately = true): void {
    useEffect(() => {
        if (callFuncImmediately) func()
        const interval = setInterval(func, seconds * 1000)
        return () => clearInterval(interval)
    }, [func, seconds])
}

// duration in seconds
export function useTimeout(func: () => void, seconds: number): void {
    useEffect(() => {
        const interval = setTimeout(func, seconds * 1000)
        return () => clearTimeout(interval)
    }, [func, seconds])
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void): void {
    useEffect(() => {
        const listener = (event: MouseEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler()
        }
        document.addEventListener('click', listener, true)
        return () => {
            document.removeEventListener('click', listener, true)
        }
    }, [ref, handler])
}
