import { icons } from '../../styles/images'
import { Icon } from './Icon'

interface GTStaticCheckboxProps {
    isChecked: boolean
}

const GTStaticCheckbox = ({ isChecked }: GTStaticCheckboxProps) => (
    <Icon icon={isChecked ? icons.checkbox_checked : icons.checkbox_unchecked} color="purple" />
)

export default GTStaticCheckbox
