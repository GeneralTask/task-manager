import { DEFAULT_FOLDER_ID } from '../../../../constants'
import { useGetTasks } from '../../../../services/api/tasks.hooks'
import GTSelect from '../../../radix/GTSelect'

interface TemplateFolderSelectorProps {
    value: string
    useTriggerWidth?: boolean
    onChange: (value: string) => void
}
const TemplateFolderSelector = ({ value, useTriggerWidth, onChange }: TemplateFolderSelectorProps) => {
    const { data: folders } = useGetTasks()
    return (
        <GTSelect
            items={
                folders
                    ?.filter((s) => !s.is_done && !s.is_trash)
                    .map((folder) => ({
                        value: folder.id,
                        label: folder.name,
                        icon: folder.id === DEFAULT_FOLDER_ID ? 'inbox' : 'folder',
                    })) ?? []
            }
            value={value}
            onChange={onChange}
            placeholder="Select a folder"
            useTriggerWidth={useTriggerWidth}
        />
    )
}

export default TemplateFolderSelector
