import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCalendarContext } from '../components/calendar/CalendarContext'
import { useGetOverviewViews } from '../services/api/overview.hooks'
import { useGetTasks } from '../services/api/tasks.hooks'
import { TOverviewView, TTaskFolder } from '../utils/types'

const useNavigateToTask = () => {
    const { pathname } = useLocation()
    const { data: viewsData } = useGetOverviewViews()
    const { data: foldersData } = useGetTasks()
    const navigate = useNavigate()
    const { setCalendarType } = useCalendarContext()

    const getTaskURL = useCallback(
        (taskID: string, views: TOverviewView[], folders: TTaskFolder[], pathname: string) => {
            const isUserOnOverviewPage = pathname.startsWith('/overview')
            if (isUserOnOverviewPage) {
                for (const view of views) {
                    for (const item of view.view_items) {
                        if (item.id === taskID) {
                            setCalendarType('day')
                            navigate(`/overview/${view.id}/${item.id}`)
                            return
                        }
                    }
                }
            }
            for (const folder of folders) {
                for (const task of folder.tasks) {
                    if (task.id === taskID) {
                        setCalendarType('day')
                        navigate(`/tasks/${folder.id}/${task.id}`)
                        return
                    }
                }
            }
            return isUserOnOverviewPage
        },
        []
    )

    return (taskID: string) => getTaskURL(taskID, viewsData ?? [], foldersData ?? [], pathname)
}

export default useNavigateToTask
