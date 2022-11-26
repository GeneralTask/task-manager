import styled from 'styled-components'
import { Border, Colors, Typography } from '../../../../styles'
import { icons } from '../../../../styles/images'
import { Icon } from '../../../atoms/Icon'
import { CreateNewTaskContainer, TaskInput } from '../../CreateNewTask'

const AddTemplateContainer = styled(CreateNewTaskContainer)<{ isButton?: boolean }>`
    ${Typography.bodySmall};
    :focus-within {
        border: ${Border.stroke.medium} solid ${Colors.border.gray};
    }
`

interface TemplateNameInputProps {
    value: string
    onChange: (value: string) => void
}
const TemplateNameInput = ({ value, onChange }: TemplateNameInputProps) => {
    return (
        <AddTemplateContainer>
            <Icon icon={icons.plus} />
            <TaskInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="Add new template" />
        </AddTemplateContainer>
    )
}

export default TemplateNameInput
