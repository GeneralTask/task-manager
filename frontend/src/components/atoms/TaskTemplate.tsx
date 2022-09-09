import { forwardRef } from 'react'
import styled from 'styled-components'
import { Dimensions } from '../../styles'
import { TASK_MARK_AS_DONE_TIMEOUT } from '../../constants'

const TemplateContainer = styled.div<{ isVisible?: boolean }>`
    width: 100%;
    position: relative;
    height: ${Dimensions.TASK_HEIGHT};
    padding: 1px 0;
    margin: 2px 0;
    opacity: ${(props) => (props.isVisible ? 1 : 0)};
    transition: opacity ${TASK_MARK_AS_DONE_TIMEOUT}s ease-out;
`
interface TaskTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    isVisible?: boolean
}
const TaskTemplate = forwardRef<HTMLDivElement, TaskTemplateProps>((props: TaskTemplateProps, ref) => {
    const { children, isVisible = true, ...attr } = props
    return (
        <TemplateContainer ref={ref} isVisible={isVisible} {...attr}>
            {children}
        </TemplateContainer>
    )
})

export default TaskTemplate
