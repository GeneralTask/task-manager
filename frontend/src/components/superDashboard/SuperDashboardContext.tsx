import { createContext, useContext, useState } from 'react'
import { emptyFunction } from '../../utils/utils'
import { dummyData2 } from './dummyData'
import { Dashboard, Interval, Subject } from './types'

export interface ContextValues {
    dashboard: Dashboard
    selectedInterval: Interval
    setSelectedInterval: React.Dispatch<React.SetStateAction<Interval>>
    selectedSubject: Subject
    setSelectedSubject: React.Dispatch<React.SetStateAction<Subject>>
    isLoading: boolean
}

const emptyInterval: Interval = {
    id: '',
    date_start: '',
    date_end: '',
}
const emptySubject: Subject = {
    id: '',
    icon: 'users',
    name: '',
    graph_ids: [],
}
const emptyDashboard: Dashboard = {
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
    children: React.ReactNode
}

export const SuperDashboardContextProvider = ({ children }: SuperDashboardContextProviderProps) => {
    const dashboard = dummyData2

    const [selectedInterval, setSelectedInterval] = useState<Interval>(
        () => dashboard.intervals.find((i) => i.is_default) ?? dashboard.intervals[0]
    )
    const [selectedSubject, setSelectedSubject] = useState<Subject>(
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
