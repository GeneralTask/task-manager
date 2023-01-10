import { useEffect, useState } from 'react'

const VISIBLE_STATES = [undefined, 'visible', 'prerender']

const useTrackPageFocus = () => {
    const [isPageFocused, setIsPageFocused] = useState(true)
    const [isPageVisible, setIsPageVisible] = useState(true)

    useEffect(() => {
        const listener = () => {
            setIsPageVisible(VISIBLE_STATES.includes(document.visibilityState))
            setIsPageFocused(document.hasFocus())
        }
        window.addEventListener('visibilitychange', listener, false)
        window.addEventListener('focus', listener, false)
        window.addEventListener('blur', listener, false)

        return () => {
            window.removeEventListener('visibilitychange', listener)
            window.removeEventListener('focus', listener)
            window.removeEventListener('blur', listener)
        }
    }, [document])

    return { isPageFocused, isPageVisible }
}

export default useTrackPageFocus
