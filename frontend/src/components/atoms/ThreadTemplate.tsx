import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Border } from '../../styles'

const DEFAULT_LINEHEIGHT = 17

const TemplateContainer = styled.div`
    width: 100%;
    position: relative;
    height: ${DEFAULT_LINEHEIGHT * 5}px;
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
