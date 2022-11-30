import styled from 'styled-components'
import GTTextField from '../atoms/GTTextField'
import NUXTaskBody from './NUXTaskBody'

const BODY_MIN_HEIGHT = 200

const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
`

interface TaskBodyProps {
    id: string
    body: string
    onChange: (val: string) => void
    disabled?: boolean
    nux_number_id?: number
}
const TaskBody = ({ id, body, onChange, disabled, nux_number_id }: TaskBodyProps) => {
    if (nux_number_id) return <NUXTaskBody nux_number_id={nux_number_id} />
    return (
        <BodyContainer>
            <GTTextField
                itemId={id}
                type="markdown"
                value={body}
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

export default TaskBody
