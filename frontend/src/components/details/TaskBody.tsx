import styled from 'styled-components'
import { TTask } from '../../utils/types'
import GTTextField from '../atoms/GTTextField'
import NUXTaskBody from './NUXTaskBody'

const BODY_MIN_HEIGHT = 200

const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    flex-basis: 750px;
`

interface TaskBodyProps {
    task: TTask
    onChange: (val: string) => void
}
const TaskBody = ({ task, onChange }: TaskBodyProps) => {
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
                    fontSize="small"
                />
            </BodyContainer>
        )
    }
    // else return NUX task body
    return <NUXTaskBody task={task} />
}

export default TaskBody
