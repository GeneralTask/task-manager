import { useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../../atoms/Icon'
import { CreateNewTaskContainer } from '../CreateNewTask'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'

const AddTemplateContainer = styled(CreateNewTaskContainer)<{ isButton?: boolean }>`
    ${Typography.bodySmall};
    ${(props) =>
        props.isButton &&
        `
        cursor: pointer;
        :hover {
            border: ${Border.stroke.medium} solid ${Colors.border.gray};
        }
    `}
    :focus-within {
        border: ${Border.stroke.medium} solid ${Colors.border.purple};
    }
`

const AddRecurringTask = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    return (
        <>
            <AddTemplateContainer isButton onClick={() => setIsModalOpen(true)}>
                <Icon icon={icons.plus} />
                Add new template
            </AddTemplateContainer>
            <RecurringTaskTemplateModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
        </>
    )
}

export default AddRecurringTask
