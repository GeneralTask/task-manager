import { useState } from 'react'
import { TExternalPriority } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'

interface JiraPriorityDropdownProps {
    currentPriority: TExternalPriority
    allPriorities: TExternalPriority[]
    disabled?: boolean
}

const JiraPriorityDropdown = ({ currentPriority, allPriorities, disabled }: JiraPriorityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)

    const items = allPriorities.map((priority) => ({
        label: priority.name,
        onClick: emptyFunction,
        icon: priority.icon_url,
        selected: currentPriority.external_id === priority.external_id,
    }))

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            items={items}
            trigger={
                <GTButton
                    value={currentPriority.name}
                    icon={currentPriority.icon_url}
                    size="small"
                    styleType="simple"
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                    disabled={disabled}
                    asDiv
                />
            }
        />
    )
}

export default JiraPriorityDropdown
