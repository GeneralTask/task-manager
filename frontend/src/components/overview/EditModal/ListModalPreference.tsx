import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../../atoms/Icon'
import { DeprecatedLabel, DeprecatedMini } from '../../atoms/typography/Typography'

const Preference = styled.div`
    margin-top: ${Spacing._16};
    display: flex;
    gap: ${Spacing._16};
`
const PreferenceDescription = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
`
const StyledMini = styled(DeprecatedMini)`
    padding-top: ${Spacing._4};
    color: ${Colors.text.light};
    cursor: pointer;
    width: fit-content;
    user-select: none;
    white-space: pre;
`
const StyledLabel = styled(DeprecatedLabel)`
    width: fit-content;
    cursor: pointer;
    user-select: none;
`
const CursorPointer = styled.div`
    cursor: pointer;
    height: fit-content;
`

interface ListModalPreference {
    text: string
    subtext: string
    onClick: () => void
    isChecked: boolean
}
const ListModalPreference = ({ text, subtext, onClick, isChecked }: ListModalPreference) => (
    <Preference>
        <CursorPointer onClick={onClick}>
            <Icon icon={isChecked ? icons.checkbox_checked_solid : icons.checkbox_unchecked} color="purple" />
        </CursorPointer>
        <PreferenceDescription>
            <StyledLabel onClick={onClick}>{text}</StyledLabel>
            <StyledMini onClick={onClick}>{subtext}</StyledMini>
        </PreferenceDescription>
    </Preference>
)

export default ListModalPreference
