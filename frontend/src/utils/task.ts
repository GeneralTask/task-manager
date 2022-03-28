import { TTask, TTaskSection } from './types'

export const getSectionById = (sections: TTaskSection[], id: string): TTaskSection | undefined => {
    if (!sections) return undefined
    return sections.find(section => section.id === id)
}

export const getTaskById = (sections: TTaskSection[], id: string): TTask | null => {
    for (const section of sections) {
        for (const task of section.tasks) {
            if (task.id === id) {
                return task
            }
        }
    }
    return null
}
