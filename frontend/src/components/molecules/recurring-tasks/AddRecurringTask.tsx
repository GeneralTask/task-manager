import { useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../../atoms/Icon'
import { CreateNewTaskContainer } from '../CreateNewTask'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'

const AddTemplateContainer = styled(CreateNewTaskContainer)<{ isButton?: boolean }>`
    ${Typography.bodySmall};
    cursor: pointer;
    :hover {
        border: ${Border.stroke.medium} solid ${Colors.border.purple};
    }
`

const AddRecurringTask = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    return (
        <>
            <AddTemplateContainer onClick={() => setIsModalOpen(true)}>
                <Icon icon={icons.plus} />
                Add new template
            </AddTemplateContainer>
            {/* conditionally rendering so that modal re-mounts and resets state after closing */}
            {isModalOpen && <RecurringTaskTemplateModal onClose={() => setIsModalOpen(false)} />}
        </>
    )
}

export default AddRecurringTask
