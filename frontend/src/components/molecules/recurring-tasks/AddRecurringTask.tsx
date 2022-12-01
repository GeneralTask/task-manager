import { useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Dimensions, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../../atoms/Icon'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'

export const AddTemplateContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${Spacing._8};
    background-color: ${Colors.background.medium};
    height: ${Dimensions.TASK_HEIGHT};
    align-items: center;
    padding: 0px ${Spacing._8};
    border-radius: ${Border.radius.mini};
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid transparent;
    margin-bottom: ${Spacing._8};
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
            {isModalOpen && <RecurringTaskTemplateModal onClose={() => setIsModalOpen(false)} />}
        </>
    )
}

export default AddRecurringTask
