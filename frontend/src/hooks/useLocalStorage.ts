import { useEffect, useState } from 'react'

const useLocalStorage = (storageKey: string, fallbackState: boolean) => {
    const [val, setVal] = useState(
        JSON.parse(localStorage.getItem(storageKey) ?? '{}') ?? fallbackState
    )

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(val))
    }, [val, storageKey])

    return [val, setVal]
}

export default useLocalStorage
