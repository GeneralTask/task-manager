import styled from 'styled-components'
import { TTaskUnion } from '../../utils/types'
import GTTextField from '../atoms/GTTextField'
import NUXTaskBody from './NUXTaskBody'

const BODY_MIN_HEIGHT = 200

const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
`

interface TaskBodyProps {
    task: TTaskUnion
    onChange: (val: string) => void
    disabled?: boolean
}
const TaskBody = ({ task, onChange, disabled }: TaskBodyProps) => {
    if (!('nux_number_id' in task ? task.nux_number_id : task.id_nux_number)) {
        return (
            <BodyContainer>
                <GTTextField
                    itemId={task.id}
                    type="markdown"
                    value={task.body}
                    placeholder="Add details"
                    onChange={onChange}
                    minHeight={BODY_MIN_HEIGHT}
                    readOnly={disabled}
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
