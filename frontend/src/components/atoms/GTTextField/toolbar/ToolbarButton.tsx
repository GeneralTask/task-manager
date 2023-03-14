import { TIconType } from '../../Icon'
import GTButton from '../../buttons/GTButton'

interface Props {
    icon: TIconType
    action: () => void
    isActive?: boolean
    shortcutLabel: string
    shortcut?: string
}
const ToolbarButton = ({ icon, action, isActive, shortcutLabel, shortcut }: Props) => {
    return (
        <GTButton
            styleType="icon"
            onMouseDown={(e) => e.preventDefault()}
            icon={icon}
            iconColor="gray"
            onClick={() => action()}
            active={isActive}
            overrideShortcut={shortcut}
            overrideShortcutLabel={shortcutLabel}
        />
    )
}

export default ToolbarButton
