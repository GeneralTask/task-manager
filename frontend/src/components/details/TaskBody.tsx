import styled from 'styled-components'
import { TTask } from '../../utils/types'
import GTTextField from '../atoms/GTTextField'
import NUXTaskBody from './NUXTaskBody'

const BODY_MIN_HEIGHT = 200

const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
`

interface TaskBodyProps {
    task: TTask
    onChange: (val: string) => void
    disabled?: boolean
}
const TaskBody = ({ task, onChange, disabled }: TaskBodyProps) => {
    if (!task.nux_number_id) {
        return (
            <BodyContainer>
                <GTTextField
                    itemId={task.id}
                    type="markdown"
                    value={task.body}
                    placeholder="Add details"
                    onChange={onChange}
                    minHeight={BODY_MIN_HEIGHT}
                    disabled={disabled}
                    fontSize="small"
                />
            </BodyContainer>
        )
    }
    // else return NUX task body
    return <NUXTaskBody task={task} />
}

export default TaskBody
