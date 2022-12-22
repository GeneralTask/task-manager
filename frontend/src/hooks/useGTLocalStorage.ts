import { Dispatch, SetStateAction, useState } from 'react'

type TLocalStorageKeys =
    | 'noteCreation'
    | 'previewMode'
    | 'navigationCollapsed'
    | 'calendarCollapsed'
    | 'resizableDetails'
    | 'overdueCollapsed'
    | 'dueTodayCollapsed'
    | 'taskToCalendarSidebar'

// based on https://usehooks.com/useLocalStorage/
const useGTLocalStorage = <T>(key: TLocalStorageKeys, initialValue: T): [T, Dispatch<SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState(() => {
        // Get from local storage by key
        const item = window.localStorage.getItem(key)
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) : initialValue
    })

    const setValue = (value: T | ((val: T) => T)) => {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        // Save state
        setStoredValue(valueToStore)
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
    }
    return [storedValue, setValue]
}

export default useGTLocalStorage
