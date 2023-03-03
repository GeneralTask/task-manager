import { DEFAULT_FOLDER_ID } from '../../../../constants'
import { useGetFolders } from '../../../../services/api/folders.hooks'
import GTSelect from '../../../radix/GTSelect'

interface TemplateFolderSelectorProps {
    value: string
    useTriggerWidth?: boolean
    onChange: (value: string) => void
}
const TemplateFolderSelector = ({ value, useTriggerWidth, onChange }: TemplateFolderSelectorProps) => {
    const { data: folders } = useGetFolders()
    return (
        <GTSelect
            items={
                folders
                    ?.filter((f) => !f.is_done && !f.is_trash)
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
