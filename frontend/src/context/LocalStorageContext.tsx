import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { emptyFunction } from '../utils/utils'

interface TLocalStorageContext {
    employeeMode: boolean
    setEmployeeMode: (showShortcut: boolean) => void
}

const LocalStorageContext = createContext<TLocalStorageContext>({
    employeeMode: true,
    setEmployeeMode: emptyFunction,
})

interface LocalStorageContextProps {
    children: ReactNode
}

export const LocalStorageContextProvider = ({ children }: LocalStorageContextProps) => {
    const [employeeMode, setEmployeeMode] = useState(() => {
        const item = localStorage.getItem('employeeMode')
        return item ? (JSON.parse(item) as boolean) : false
    })

    useEffect(() => {
        localStorage.setItem('employeeMode', JSON.stringify(employeeMode))
    }, [employeeMode])

    return (
        <LocalStorageContext.Provider
            value={{
                employeeMode,
                setEmployeeMode,
            }}
        >
            {children}
        </LocalStorageContext.Provider>
    )
}

const useLocalStorageContext = () => useContext(LocalStorageContext)

export default useLocalStorageContext
