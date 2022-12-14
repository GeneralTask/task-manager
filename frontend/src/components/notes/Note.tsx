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
const TitleContainer = styled.span`
    display: flex;
    gap: ${Spacing._8};
    align-items: center;
    min-width: 0;
    margin-right: ${Spacing._8};
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
                <TitleContainer>
                    <Icon icon={icons.note} />
                    <NoteTitle>{note.title}</NoteTitle>
                </TitleContainer>
                <Flex gap={Spacing._12} alignItems="center">
                    {isShared && <Icon icon={icons.link} />}
                    <Label color="light">{getHumanDateTime(DateTime.fromISO(note.created_at))}</Label>
                </Flex>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default Note
