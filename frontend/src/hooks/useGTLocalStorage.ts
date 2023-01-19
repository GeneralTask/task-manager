import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

type TLocalStorageKeys =
    | 'noteCreation'
    | 'previewMode'
    | 'navigationCollapsed'
    | 'calendarCollapsed'
    | 'resizableDetails'
    | 'overdueCollapsed'
    | 'dueTodayCollapsed'
    | 'taskToCalendarSidebar'
    | 'overviewAutomaticEmptySort'
    | 'isUsingSmartPrioritization'

// based on https://usehooks.com/useLocalStorage/
// if updateOnStoreChange is true, the hook will update the state when the value is changed on this tab or another tab
const useGTLocalStorage = <T>(
    key: TLocalStorageKeys,
    initialValue: T,
    updateOnStoreChange = false
): [T, Dispatch<SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState(() => {
        // Get from local storage by key
        const item = window.localStorage.getItem(key)
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) : initialValue
    })

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value
            // Save state
            setStoredValue(valueToStore)
            const serialized = JSON.stringify(valueToStore)
            // Save to local storage
            window.localStorage.setItem(key, serialized)
            // Dispatch custom event so other instances of this hook can re-render
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key,
                    newValue: serialized,
                })
            )
        },
        [storedValue, key, setStoredValue]
    )

    useEffect(() => {
        if (!updateOnStoreChange) return

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                setStoredValue(JSON.parse(e.newValue))
            }
        }
        addEventListener('storage', handleStorageChange)
        return () => {
            removeEventListener('storage', handleStorageChange)
        }
    }, [key])

    return [storedValue, setValue]
}

export default useGTLocalStorage
