
import { TTask, TTaskSection } from './types'


export const findTaskById = (sections: TTaskSection[], id: string): TTask | null => {
    for (const section of sections) {
        for (const task of section.tasks) {
            if (task.id === id) {
                return task
            }
        }
    }
    return null
}
