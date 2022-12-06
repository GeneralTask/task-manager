import styled from 'styled-components'
import { Typography } from '../../../../styles'
import { icons } from '../../../../styles/images'
import { Icon } from '../../../atoms/Icon'
import { CreateNewTaskContainer, TaskInput } from '../../CreateNewTask'

const TemplateNameInput = styled(TaskInput)`
    ${Typography.bodySmall};
`
interface NewTemplateNameInputProps {
    value: string
    onChange: (value: string) => void
}
const NewTemplateNameInput = ({ value, onChange }: NewTemplateNameInputProps) => {
    return (
        <CreateNewTaskContainer>
            <Icon icon={icons.plus} />
            <TemplateNameInput
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Add new template"
            />
        </CreateNewTaskContainer>
    )
}

export default NewTemplateNameInput
