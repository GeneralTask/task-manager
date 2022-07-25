import { useLayoutEffect, useRef } from 'react'


export const useUnload = (func: (e: BeforeUnloadEvent) => void) => {
    const funcRef = useRef(func)
    useLayoutEffect(() => {
        const onUnload = funcRef.current
        window.addEventListener('beforeunload', onUnload)
        return () => {
            window.removeEventListener('beforeunload', onUnload)
        }
    }, [funcRef])
}
