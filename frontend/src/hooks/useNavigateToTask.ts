import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useGetOverviewViews } from "../services/api/overview.hooks"
import { useGetTasks } from "../services/api/tasks.hooks"
import { TOverviewView, TTaskSection } from "../utils/types"

const useNavigateToTask = () => {
    const { pathname } = useLocation()
    const { data: viewsData } = useGetOverviewViews()
    const { data: sectionsData } = useGetTasks()
    const navigate = useNavigate()

    const getTaskURL = useCallback((taskID: string, views: TOverviewView[], sections: TTaskSection[]) => {
        const isUserOnOverviewPage = pathname.startsWith('/overview')
        if (isUserOnOverviewPage) {
            for (const view of views) {
                for (const item of view.view_items) {
                    if (item.id === taskID) {
                        navigate(`/overview/${view.id}/${item.id}`)
                        return
                    }
                }
            }
        }
        for (const section of sections) {
            for (const task of section.tasks) {
                if (task.id === taskID) {
                    navigate(`/tasks/${section.id}/${task.id}`)
                    return
                }
            }
        }
        return isUserOnOverviewPage
    }, [pathname])

    return (taskID: string) => getTaskURL(taskID, viewsData ?? [], sectionsData ?? [])
}

export default useNavigateToTask