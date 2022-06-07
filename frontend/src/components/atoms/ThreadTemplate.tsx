import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Border } from '../../styles'
import { TASK_DEFAULT_LINE_HEIGHT } from '../../styles/dimensions'

const TemplateContainer = styled.div`
    width: 100%;
    position: relative;
    height: calc(${TASK_DEFAULT_LINE_HEIGHT} * 4);
    border-radius: ${Border.radius.large};
    padding: 1px 0;
`
interface TaskTemplateProps {
    isShadow?: boolean
    children: React.ReactNode
}
const TaskTemplate = forwardRef<HTMLDivElement, TaskTemplateProps>((props: TaskTemplateProps, ref) => {
    return <TemplateContainer ref={ref}>{props.children}</TemplateContainer>
})

export default TaskTemplate
