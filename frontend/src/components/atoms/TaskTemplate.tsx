import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Dimensions } from '../../styles'

const TemplateContainer = styled.div`
    width: 100%;
    position: relative;
    height: ${Dimensions.TASK_HEIGHT};
    padding: 1px 0;
    margin: 2px 0;
`
interface TaskTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}
const TaskTemplate = forwardRef<HTMLDivElement, TaskTemplateProps>((props: TaskTemplateProps, ref) => {
    const { children, ...attr } = props
    return (
        <TemplateContainer ref={ref} {...attr}>
            {children}
        </TemplateContainer>
    )
})

export default TaskTemplate
