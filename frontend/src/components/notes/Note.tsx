import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import { getHumanDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import TaskTemplate from '../atoms/TaskTemplate'
import { Label, Truncated } from '../atoms/typography/Typography'
import ItemContainer from '../molecules/ItemContainer'

const NoteTitle = styled(Truncated)`
    ${Typography.bodySmall};
`
interface NoteProps {
    note: TNote
    isSelected: boolean
    onSelect: (note: TNote) => void
}
const Note = ({ note, isSelected, onSelect }: NoteProps) => {
    const isShared = +DateTime.fromISO(note.shared_until) > +DateTime.local()
    return (
        <TaskTemplate>
            <ItemContainer isSelected={isSelected} onClick={() => onSelect(note)}>
                <Flex gap={Spacing._12} alignItems="center">
                    <Icon icon={isShared ? icons.link : icons.note} color={isShared ? 'green' : 'black'} />
                    <NoteTitle>{note.title}</NoteTitle>
                </Flex>
                <Flex gap={Spacing._12} alignItems="center">
                    <Label color="light">{getHumanDateTime(DateTime.fromISO(note.created_at))}</Label>
                </Flex>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default Note
