import Tip from '../../../radix/Tip'
import { TIconType } from '../../Icon'
import GTIconButton from '../../buttons/GTIconButton'

interface Props {
    icon: TIconType
    action: () => void
    isActive?: boolean
    shortcutLabel: string
    shortcut?: string
}
const ToolbarButton = ({ icon, action, isActive, shortcutLabel, shortcut }: Props) => {
    return (
        <Tip overrideShortcut={shortcut} overrideShortcutLabel={shortcutLabel}>
            <GTIconButton
                tooltipText="" // has to be empty string so that we can override it with the shortcut
                onMouseDown={(e) => e.preventDefault()}
                icon={icon}
                iconColor="gray"
                onClick={() => action()}
                forceShowHoverEffect={isActive}
            />
        </Tip>
    )
}

export default ToolbarButton
