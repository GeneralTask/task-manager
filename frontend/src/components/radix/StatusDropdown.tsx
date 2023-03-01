import { useState } from 'react'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { externalStatusIcons } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTDropdownMenu from './GTDropdownMenu'

interface StatusDropdownProps {
    task: TTask
    disabled?: boolean
    condensedTrigger?: boolean
}

const StatusDropdown = ({ task, disabled, condensedTrigger }: StatusDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    const externalStatus = task.external_status ? task.external_status : null
    const allStatuses = task.all_statuses ? task.all_statuses : null
    if (!externalStatus || !allStatuses) return null

    const dropdownItems = allStatuses.map((status) => ({
        label: status.state,
        icon: externalStatusIcons[status.type],
        onClick: () => modifyTask({ id: task.id, status: status }, task.optimisticId),
        selected: status.state === externalStatus.state,
        disabled: status.is_valid_transition === false,
        tip:
            status.is_valid_transition === false && task.source.name === 'Jira'
                ? `A workflow rule is preventing 
        you from moving this issue to 
        "${status.state}."`
                : undefined,
    }))

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            items={dropdownItems}
            unstyledTrigger
            trigger={
                condensedTrigger ? (
                    <GTIconButton
                        icon={externalStatusIcons[externalStatus.type]}
                        tooltipText={task.external_status?.state ?? ''}
                        forceShowHoverEffect={isOpen}
                        disabled={disabled}
                        asDiv
                    />
                ) : (
                    <GTButton
                        value={externalStatus.state}
                        icon={externalStatusIcons[externalStatus.type]}
                        size="small"
                        styleType="simple"
                        isDropdown
                        active={isOpen}
                        disabled={disabled}
                        asDiv
                    />
                )
            }
        />
    )
}

export default StatusDropdown
