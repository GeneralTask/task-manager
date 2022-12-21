import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

type TLocalStorageKeys =
    | 'noteCreation'
    | 'previewMode'
    | 'navigationCollapsed'
    | 'calendarCollapsed'
    | 'resizableDetails'
    | 'overdueCollapsed'
    | 'dueTodayCollapsed'
    | 'taskToCalendarSidebar'

declare type SetValue<T> = Dispatch<SetStateAction<T>>
const useGTLocalStorage = <T>(key: TLocalStorageKeys, initialValue: T, loadOnce = false): [T, SetValue<T>] => {
    const [val, setVal] = useLocalStorage(key, initialValue)
    const [value, setValue] = useState<T>(val)
    useEffect(() => {
        setVal(value)
    }, [value])

    if (loadOnce) {
        return [value, setValue]
    }
    return [val, setVal]
}

export default useGTLocalStorage
