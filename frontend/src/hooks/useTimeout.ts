import { useEffect } from 'react'

// duration in seconds
export default function useTimeout(func: () => void, seconds: number): void {
    useEffect(() => {
        const interval = setTimeout(func, seconds * 1000)
        return () => clearTimeout(interval)
    }, [func, seconds])
}
