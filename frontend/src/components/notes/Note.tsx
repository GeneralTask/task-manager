// import { TASK_PRIORITIES } from '../../../constants'
// import { Spacing } from '../../../styles'
// import { icons } from '../../../styles/images'
// import { TnoteTemplate } from '../../../utils/types'
// import Flex from '../../atoms/Flex'
// import { Icon } from '../../atoms/Icon'
// import TaskTemplate from '../../atoms/TaskTemplate'
// import { Truncated } from '../../atoms/typography/Typography'
// import ItemContainer from '../ItemContainer'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import TaskTemplate from '../atoms/TaskTemplate'
import { Truncated } from '../atoms/typography/Typography'
import ItemContainer from '../molecules/ItemContainer'

interface NoteProps {
    note: TNote
    isSelected: boolean
    onSelect: (note: TNote) => void
}
const note = ({ note, isSelected, onSelect }: NoteProps) => {
    return (
        <TaskTemplate>
            <ItemContainer isSelected={isSelected} onClick={() => onSelect(note)}>
                <Truncated>{note.title}</Truncated>
                <Flex gap={Spacing._12}>
                    <Icon icon={icons.note} />
                </Flex>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default note
