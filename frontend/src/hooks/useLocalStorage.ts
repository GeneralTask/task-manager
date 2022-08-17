import React from 'react'

function readStorage<T>(key: string): T | undefined {
    if (typeof window === 'undefined') return undefined
    try {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : undefined
    } catch (e) {
        console.log(e)
        return undefined
    }
}

function writeStorage<T>(key: string, value: T) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
}

export default function useLocalStorage<T>(key: string, initialValue: T) {

    const [persistentValue, setPersistentValue] = React.useState<T>(() => readStorage(key) || initialValue)

    const setValue = (value: T | ((val: T) => T)) => {
        const valueToStore = value instanceof Function ? value(persistentValue) : value
        setPersistentValue(valueToStore)
        writeStorage(key, valueToStore)
    }
    return [persistentValue, setValue] as const
}

// TODO: unused, probably remove
