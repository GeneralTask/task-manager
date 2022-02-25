
import { TTask, TTaskSection } from "./types"


export const findTaskById = (sections: TTaskSection[], id: string): TTask | null => {
    for (let section of sections) {
        for (let task of section.tasks) {
            if (task.id === id) {
                return task
            }
        }
    }
    return null
}
