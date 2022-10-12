import { useState } from 'react'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { linearStatus } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'

interface LinearStatusDropdownProps {
    task: TTask
    disabled?: boolean
}
const LinearStatusDropdown = ({ task, disabled }: LinearStatusDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    const status = task.external_status ? task.external_status.state : ''
    if (!task.external_status || !task.all_statuses) return <></>
    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            items={task.all_statuses.map((status) => ({
                label: status.state,
                onClick: () => modifyTask({ id: task.id, status: status }),
                icon: linearStatus[status.type],
                selected: status.state === task.external_status?.state,
            }))}
            trigger={
                <GTButton
                    value={status}
                    icon={linearStatus[task.external_status.type]}
                    size="small"
                    styleType="simple"
                    isDropdown
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                    asDiv
                />
            }
        />
    )
}

export default LinearStatusDropdown
