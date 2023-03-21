import { createContext, useContext, useState } from 'react'
import { emptyFunction } from '../../utils/utils'
import { TDashboard, TInterval, TSubject } from './types'

export interface ContextValues {
    dashboard: TDashboard
    selectedInterval: TInterval
    setSelectedInterval: React.Dispatch<React.SetStateAction<TInterval>>
    selectedSubject: TSubject
    setSelectedSubject: React.Dispatch<React.SetStateAction<TSubject>>
    isLoading: boolean
}

const emptyInterval: TInterval = {
    id: '',
    date_start: '',
    date_end: '',
}
const emptySubject: TSubject = {
    id: '',
    icon: 'users',
    name: '',
    graph_ids: [],
}
const emptyDashboard: TDashboard = {
    intervals: [emptyInterval],
    subjects: [emptySubject],
    graphs: {},
    data: {},
}

const SuperDashboardContext = createContext<ContextValues>({
    dashboard: emptyDashboard,
    selectedInterval: emptyInterval,
    setSelectedInterval: emptyFunction,
    selectedSubject: emptySubject,
    setSelectedSubject: emptyFunction,
    isLoading: true,
})

interface SuperDashboardContextProviderProps {
    dashboard: TDashboard
    children: React.ReactNode
}

export const SuperDashboardContextProvider = ({ dashboard, children }: SuperDashboardContextProviderProps) => {
    const [selectedInterval, setSelectedInterval] = useState<TInterval>(
        () => dashboard.intervals.find((i) => i.is_default) ?? dashboard.intervals[0]
    )
    const [selectedSubject, setSelectedSubject] = useState<TSubject>(
        () => dashboard.subjects.find((s) => s.is_default) ?? dashboard.subjects[0]
    )

    const value = {
        dashboard,
        selectedInterval,
        setSelectedInterval,
        selectedSubject,
        setSelectedSubject,
        isLoading: false,
    }

    return <SuperDashboardContext.Provider value={value}>{children}</SuperDashboardContext.Provider>
}

export const useSuperDashboardContext = () => {
    return useContext(SuperDashboardContext)
}
