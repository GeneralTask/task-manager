import { useState } from 'react'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { externalStatusIcons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'

interface StatusDropdownProps {
    task: TTaskV4
    disabled?: boolean
}

const StatusDropdown = ({ task, disabled }: StatusDropdownProps) => {
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
    }))

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            items={dropdownItems}
            unstyledTrigger
            trigger={
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
            }
        />
    )
}

export default StatusDropdown
