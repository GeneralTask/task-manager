import { useGetTasksV4 } from '../services/api/tasksv4.hooks'

const useGetActiveTasks = (isEnabled = true) => {
    const { data, ...rest } = useGetTasksV4(isEnabled)

    return {
        data: data?.filter((task) => !task.is_done && !task.is_deleted),
        ...rest,
    }
}

export default useGetActiveTasks
