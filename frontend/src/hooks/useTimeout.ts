import { useEffect } from 'react'

// duration in ms
export default function useTimeout(func: () => void, ms: number): void {
    useEffect(() => {
        const interval = setTimeout(func, ms)
        return () => clearTimeout(interval)
    }, [func, ms])
}
