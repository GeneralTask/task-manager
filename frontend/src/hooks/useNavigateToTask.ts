import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import { useCalendarContext } from '../components/calendar/CalendarContext'
import { useGetFolders } from '../services/api/folders.hooks'
import Log from '../services/api/log'
import { useGetOverviewViews } from '../services/api/overview.hooks'
import { useGetTasksV4 } from '../services/api/tasks.hooks'
import { TOverviewView, TTaskFolder, TTaskV4 } from '../utils/types'
import { getFolderIdFromTask } from '../utils/utils'

export interface TNavigateToTaskParams {
    taskId: string
    tasks?: TTaskV4[]
    folders?: TTaskFolder[]
    views?: TOverviewView[]
}

const useNavigateToTask = () => {
    const { data: tasksData } = useGetTasksV4()
    const { data: viewsData } = useGetOverviewViews()
    const { data: foldersData } = useGetFolders()
    const navigate = useNavigate()
    const { setCalendarType } = useCalendarContext()
    const params = useParams()

    const getTaskURL = useCallback(
        (taskId: string, tasks: TTaskV4[], folders: TTaskFolder[], views: TOverviewView[]) => {
            const task = tasks.find((task) => task.id === taskId)
            if (!task) return
            const folderId = getFolderIdFromTask(task, tasks, folders)
            const suffix = task.id_parent ? `${task.id_parent}/${taskId}` : taskId

            const isUserOnOverviewPage = window.location.pathname.startsWith('/overview')
            if (isUserOnOverviewPage) {
                // first check the current view
                const currentView = views.find((view) => view.id === params.overviewViewId)
                if (currentView?.view_item_ids.some((id) => id === taskId || id === task.id_parent)) {
                    navigate(`/overview/${currentView.id}/${suffix}`)
                    Log(`task_navigate__/overview/${currentView.id}/${suffix}`)
                    return
                }
                // otherwise check all views
                for (const view of views) {
                    if (view?.view_item_ids.some((id) => id === taskId || id === task.id_parent)) {
                        setCalendarType('day')
                        navigate(`/overview/${view.id}/${suffix}`)
                        Log(`task_navigate__/overview/${view.id}/${suffix}`)
                        return
                    }
                }
            }

            setCalendarType('day')
            if (task.source.name === 'Slack' && window.location.pathname.startsWith('/slack')) {
                navigate(`/slack/${suffix}`)
                Log(`task_navigate__/slack/${suffix}`)
            } else if (task.source.name === 'Linear' && window.location.pathname.startsWith('/linear')) {
                navigate(`/linear/${suffix}`)
                Log(`task_navigate__/linear/${suffix}`)
            } else if (folderId && suffix) {
                navigate(`/tasks/${folderId}/${suffix}`)
                Log(`task_navigate__/task/${folderId}/${suffix}`)
            } else {
                Sentry.captureMessage(`Could not navigate to task ${taskId}`)
            }
            return
        },
        []
    )

    return ({ taskId, tasks, folders, views }: TNavigateToTaskParams) =>
        getTaskURL(taskId, tasks ?? tasksData ?? [], folders ?? foldersData ?? [], views ?? viewsData ?? [])
}

export default useNavigateToTask
