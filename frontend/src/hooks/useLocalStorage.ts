import { useState } from 'react'


export default function useLocalStorage<T>(key: string, initialValue: T) {

    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue
        }
        try {
            const item = window.localStorage.getItem(key)
            const parsedItem = item ? JSON.parse(item) : initialValue
            console.log('getting item', parsedItem, 'with key', key)
            return parsedItem
        } catch (e) {
            console.log(e)
            return initialValue
        }
    })

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            if (typeof window !== 'undefined') {
                console.log('setting item', valueToStore, 'with key', key)
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
        } catch (e) {
            console.log(e)
        }
    }
    return [storedValue, setValue] as const
}
