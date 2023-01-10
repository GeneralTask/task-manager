import { useCallback, useEffect, useRef, useState } from 'react'
import { FIVE_MINUTE_INTERVAL } from '../constants'
import Log from '../services/api/log'
import useInterval from './useInterval'

const VISIBLE_STATES = [undefined, 'visible', 'prerender']

const useTrackPageFocus = (logTimeSpent = false) => {
    const [isPageFocused, setIsPageFocused] = useState(true)
    const [isPageVisible, setIsPageVisible] = useState(true)

    // last time the page was focused or visible, null if not currently focused or visible
    const lastTimeFocused = useRef<number | null>(Date.now())
    const lastTimeVisible = useRef<number | null>(Date.now())
    // how long the page has been focused or visible in the current 5 minute interval
    const timeFocused = useRef(0)
    const timeVisible = useRef(0)

    useEffect(() => {
        const listener = () => {
            const isFocused = document.hasFocus()
            const isVisible = VISIBLE_STATES.includes(document.visibilityState)
            setIsPageFocused(isFocused)
            setIsPageVisible(isVisible)

            if (!logTimeSpent) return
            const now = Date.now()

            // focus -> blur
            if (lastTimeFocused.current != null && !isFocused) {
                const timeSpentFocused = now - lastTimeFocused.current
                timeFocused.current += timeSpentFocused
                lastTimeFocused.current = null
            }
            // blur -> focus
            else if (lastTimeFocused.current == null && isFocused) {
                lastTimeFocused.current = now
            }
            // visible -> hidden
            if (lastTimeVisible.current != null && !isVisible) {
                const timeSpentVisible = now - lastTimeVisible.current
                timeVisible.current += timeSpentVisible
                lastTimeVisible.current = null
            }
            // hidden -> visible
            else if (lastTimeVisible.current == null && isVisible) {
                lastTimeVisible.current = now
            }
        }
        window.addEventListener('visibilitychange', listener, false)
        window.addEventListener('focus', listener, false)
        window.addEventListener('blur', listener, false)

        return () => {
            window.removeEventListener('visibilitychange', listener)
            window.removeEventListener('focus', listener)
            window.removeEventListener('blur', listener)
        }
    }, [])

    useInterval(
        useCallback(() => {
            if (!logTimeSpent) return
            const now = Date.now()

            if (lastTimeFocused.current != null) {
                const timeSpentFocused = now - lastTimeFocused.current
                timeFocused.current += timeSpentFocused
                lastTimeFocused.current = now
            }
            if (timeFocused.current > 0) {
                Log({ page_visible: timeFocused.current })
                timeFocused.current = 0
            }

            if (lastTimeVisible.current != null) {
                const timeSpentVisible = now - lastTimeVisible.current
                timeVisible.current += timeSpentVisible
                lastTimeVisible.current = now
            }
            if (timeVisible.current > 0) {
                Log({ page_visible: timeVisible.current })
                timeVisible.current = 0
            }
        }, []),
        FIVE_MINUTE_INTERVAL,
        false
    )

    return { isPageFocused, isPageVisible }
}

export default useTrackPageFocus
