import { DEFAULT_SECTION_ID } from '../../../../constants'
import { useGetTasks } from '../../../../services/api/tasks.hooks'
import { Spacing } from '../../../../styles'
import Flex from '../../../atoms/Flex'
import { BodySmall } from '../../../atoms/typography/Typography'
import GTSelect from '../../../radix/GTSelect'

interface TemplateFolderSelectorProps {
    value: string
    onChange: (value: string) => void
}
const TemplateFolderSelector = ({ value, onChange }: TemplateFolderSelectorProps) => {
    const { data: folders } = useGetTasks()
    return (
        <Flex column gap={Spacing._12}>
            <BodySmall>Which folder should this task appear in?</BodySmall>
            <GTSelect
                items={
                    folders?.map((folder) => ({
                        value: folder.id,
                        label: folder.name,
                        icon: folder.id === DEFAULT_SECTION_ID ? 'inbox' : 'folder',
                    })) ?? []
                }
                value={value}
                onChange={onChange}
                placeholder="Select a folder"
                useTriggerWidth
            />
        </Flex>
    )
}

export default TemplateFolderSelector
