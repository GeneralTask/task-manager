import { useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCalendarContext } from '../components/calendar/CalendarContext'
import Log from '../services/api/log'
import { useGetOverviewViews } from '../services/api/overview.hooks'
import { useGetTasksV4 } from '../services/api/tasksv4.hooks'
import { TOverviewView, TTaskV4 } from '../utils/types'

const useNavigateToTask = () => {
    const { pathname } = useLocation()
    const { data: allTasks } = useGetTasksV4()
    const { data: viewsData } = useGetOverviewViews()
    const navigate = useNavigate()
    const { setCalendarType } = useCalendarContext()
    const params = useParams()

    const getTaskURL = useCallback((taskId: string, tasks: TTaskV4[], views: TOverviewView[], pathname: string) => {
        const task = tasks.find((task) => task.id === taskId)
        if (!task) return
        const parentId = task.id_parent
        const folderId = tasks.find((task) => task.id === parentId)?.id_folder ?? task.id_folder
        const suffix = parentId ? `${parentId}/${taskId}` : taskId

        const isUserOnOverviewPage = pathname.startsWith('/overview')
        if (isUserOnOverviewPage) {
            // first check the current view
            const currentView = views.find((view) => view.id === params.overviewViewId)
            if (currentView?.view_item_ids.some((id) => id === taskId || id === parentId)) {
                navigate(`/overview/${currentView.id}/${suffix}`)
                Log(`task_navigate__/overview/${currentView.id}/${suffix}`)
                return
            }
            // otherwise check all views
            for (const view of views) {
                if (view?.view_item_ids.some((id) => id === taskId || id === parentId)) {
                    setCalendarType('day')
                    navigate(`/overview/${view.id}/${suffix}`)
                    Log(`task_navigate__/overview/${view.id}/${suffix}`)
                    return
                }
            }
        }

        setCalendarType('day')
        if (task.source.name === 'Slack' && pathname.startsWith('/slack')) {
            navigate(`/slack/${suffix}`)
            Log(`task_navigate__/slack/${suffix}`)
        } else if (task.source.name === 'Linear' && pathname.startsWith('/linear')) {
            navigate(`/linear/${suffix}`)
            Log(`task_navigate__/linear/${suffix}`)
        } else {
            navigate(`/tasks/${folderId}/${suffix}`)
            Log(`task_navigate__/task/${folderId}/${suffix}`)
        }
        return
    }, [])

    return (taskId: string) => getTaskURL(taskId, allTasks ?? [], viewsData ?? [], pathname)
}

export default useNavigateToTask
