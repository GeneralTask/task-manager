import { Dispatch, SetStateAction } from 'react'
import { useLocalStorage } from 'usehooks-ts'

type TLocalStorageKeys = 'previewMode'

declare type SetValue<T> = Dispatch<SetStateAction<T>>
const useGTLocalStorage = <T>(key: TLocalStorageKeys, initialValue: T): [T, SetValue<T>] => {
    return useLocalStorage(key, initialValue)
}

export default useGTLocalStorage
