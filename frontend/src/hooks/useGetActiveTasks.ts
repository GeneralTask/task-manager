import { useMemo } from 'react'
import { useGetTasksV4 } from '../services/api/tasksv4.hooks'

const useGetActiveTasks = (isEnabled = true) => {
    const { data, ...rest } = useGetTasksV4(isEnabled)
    const activeTasks = useMemo(() => {
        return data?.filter((task) => !task.is_done && !task.is_deleted)
    }, [data])

    return {
        data: activeTasks,
        ...rest,
    }
}

export default useGetActiveTasks
