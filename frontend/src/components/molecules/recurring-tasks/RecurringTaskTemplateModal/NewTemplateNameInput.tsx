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

interface NewTemplateNameInputProps {
    value: string
    onChange: (value: string) => void
}
const NewTemplateNameInput = ({ value, onChange }: NewTemplateNameInputProps) => {
    return (
        <AddTemplateContainer>
            <Icon icon={icons.plus} />
            <TaskInput
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Add new template"
                ref={(node) => node?.focus()}
            />
        </AddTemplateContainer>
    )
}

export default NewTemplateNameInput
