import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCalendarContext } from '../components/calendar/CalendarContext'
import Log from '../services/api/log'
import { useGetOverviewViews } from '../services/api/overview.hooks'
import { useGetTasks } from '../services/api/tasks.hooks'
import { TOverviewView, TTaskSection } from '../utils/types'

const useNavigateToTask = () => {
    const { pathname } = useLocation()
    const { data: viewsData } = useGetOverviewViews()
    const { data: sectionsData } = useGetTasks()
    const navigate = useNavigate()
    const { setCalendarType } = useCalendarContext()

    const getTaskURL = useCallback(
        (taskID: string, views: TOverviewView[], sections: TTaskSection[], pathname: string, subtaskId?: string) => {
            const isUserOnOverviewPage = pathname.startsWith('/overview')
            if (isUserOnOverviewPage) {
                for (const view of views) {
                    for (const item of view.view_items) {
                        if (item.id === taskID) {
                            setCalendarType('day')
                            if (subtaskId) {
                                navigate(`/overview/${view.id}/${item.id}/${subtaskId}`)
                                Log(`task_navigate__/overview/${view.id}/${item.id}/${subtaskId}`)
                            } else {
                                navigate(`/overview/${view.id}/${item.id}`)
                                Log(`task_navigate__/overview/${view.id}/${item.id}`)
                            }
                            return
                        }
                    }
                }
            }
            for (const section of sections) {
                for (const task of section.tasks) {
                    if (task.id === taskID) {
                        setCalendarType('day')
                        if (task.source.name === 'Slack') {
                            navigate(`/slack/${task.id}`)
                            Log(`task_navigate__/slack/${task.id}`)
                        } else if (task.source.name === 'Linear') {
                            navigate(`/linear/${task.id}`)
                            Log(`task_navigate__/linear/${task.id}`)
                        } else {
                            if (subtaskId) {
                                navigate(`/tasks/${section.id}/${task.id}/${subtaskId}`)
                                Log(`task_navigate__/task/${section.id}/${task.id}/${subtaskId}`)
                            } else {
                                navigate(`/tasks/${section.id}/${task.id}`)
                                Log(`task_navigate__/tasks/${section.id}/${task.id}`)
                            }
                        }
                        return
                    }
                }
            }
            // If the task doesn't exist in task sections (ex. Meeting Prep Tasks), force going to the overview page
            for (const view of views) {
                for (const item of view.view_items) {
                    if (item.id === taskID) {
                        setCalendarType('day')
                        if (subtaskId) {
                            navigate(`/overview/${view.id}/${item.id}/${subtaskId}`)
                            Log(`task_navigate__/overview/${view.id}/${item.id}/${subtaskId}`)
                        } else {
                            navigate(`/overview/${view.id}/${item.id}`)
                            Log(`task_navigate__/overview/${view.id}/${item.id}`)
                        }
                        return
                    }
                }
            }
            return isUserOnOverviewPage
        },
        []
    )

    return (taskID: string, subtaskId?: string) =>
        getTaskURL(taskID, viewsData ?? [], sectionsData ?? [], pathname, subtaskId)
}

export default useNavigateToTask
