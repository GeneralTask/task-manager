import { useState } from 'react'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { TTask } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'

interface JiraStatusDropdownProps {
    task: TTask
    disabled?: boolean
}

const JiraStatusDropdown = ({ task, disabled }: JiraStatusDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    const externalStatus = task.external_status ? task.external_status : null
    const allStatuses = task.all_statuses ? task.all_statuses : null
    if (!externalStatus || !allStatuses) return <></>

    const dropdownItems = allStatuses.map((status) => ({
        label: status.state,
        onClick: () => modifyTask({ id: task.id, status: status }, task.optimisticId),
        selected: status.state === externalStatus.state,
    }))

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            items={dropdownItems}
            trigger={
                <GTButton
                    value={externalStatus.state}
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

export default JiraStatusDropdown
