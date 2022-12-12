import { DEFAULT_SECTION_ID } from '../../../../constants'
import { Spacing } from '../../../../styles'
import { icons } from '../../../../styles/images'
import Flex from '../../../atoms/Flex'
import GTButton from '../../../atoms/buttons/GTButton'
import { BodySmall } from '../../../atoms/typography/Typography'
import FolderSelector from '../../FolderSelector'

interface TemplateFolderSelectorProps {
    value: string
    onChange: (value: string) => void
}
const TemplateFolderSelector = ({ value, onChange }: TemplateFolderSelectorProps) => {
    return (
        <Flex column gap={Spacing._12}>
            <BodySmall>Which folder should this task appear in?</BodySmall>
            <FolderSelector
                value={value}
                onChange={onChange}
                useTriggerWidth
                fontStyle="bodySmall"
                renderTrigger={(isOpen, setIsOpen, selectedFolderName) => (
                    <GTButton
                        onClick={() => setIsOpen(!isOpen)}
                        icon={selectedFolderName?.id === DEFAULT_SECTION_ID ? icons.inbox : icons.folder}
                        value={selectedFolderName?.name}
                        styleType="secondary"
                        size="small"
                        fitContent={false}
                        isDropdown
                        asDiv
                    />
                )}
            />
        </Flex>
    )
}

export default TemplateFolderSelector
