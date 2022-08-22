import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Dimensions } from '../../styles'

const TemplateContainer = styled.div<{ invisible?: boolean }>`
    width: 100%;
    position: relative;
    height: ${Dimensions.TASK_HEIGHT};
    padding: 1px 0;
    margin: 2px 0;
    opacity: ${(props) => (props.invisible ? 0 : 1)};
    transition: opacity 0.15s ease-in-out;
`
interface TaskTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    invisible?: boolean
}
const TaskTemplate = forwardRef<HTMLDivElement, TaskTemplateProps>((props: TaskTemplateProps, ref) => {
    const { children, invisible, ...attr } = props
    return (
        <TemplateContainer ref={ref} invisible={invisible} {...attr}>
            {children}
        </TemplateContainer>
    )
})

export default TaskTemplate
