import { useModifyTask } from '../../services/api/tasks.hooks'
import { externalStatusIcons, icons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import { GTButtonHack } from '../molecules/Task'
import GTDropdownMenu from './GTDropdownMenu'

interface StatusDropdownProps {
    task: TTaskV4
    disabled?: boolean
    condensedTrigger?: boolean
}

const StatusDropdown = ({ task, disabled, condensedTrigger }: StatusDropdownProps) => {
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
            items={dropdownItems}
            disabled={disabled}
            trigger={
                condensedTrigger ? (
                    <GTButtonHack
                        icon={externalStatusIcons[externalStatus.type]}
                        styleType="control"
                        tooltipText={externalStatus.state}
                    />
                ) : (
                    <GTButton
                        value={externalStatus.state}
                        styleType="control"
                        icon={externalStatusIcons[externalStatus.type]}
                        rightIcon={icons.caret_down_solid}
                    />
                )
            }
        />
    )
}

export default StatusDropdown
