import Tip from '../../../radix/Tip'
import { TIconType } from '../../Icon'
import GTIconButton from '../../buttons/GTIconButton'

interface Props {
    icon: TIconType
    action: () => void
    isActive: boolean
    shortcutLabel?: string
    shortcut?: string
}
const ToolbarButton = ({ icon, action, isActive, shortcutLabel, shortcut }: Props) => {
    if (!(shortcutLabel || shortcut))
        return (
            <GTIconButton
                onMouseDown={(e) => e.preventDefault()}
                icon={icon}
                iconColor="gray"
                onClick={() => action()}
                forceShowHoverEffect={isActive}
            />
        )

    return (
        <Tip overrideShortcut={shortcut} overrideShortcutLabel={shortcutLabel}>
            <GTIconButton
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
