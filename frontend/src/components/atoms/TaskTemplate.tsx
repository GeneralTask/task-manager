import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Border } from '../../styles'

const DEFAULT_LINEHEIGHT = 17

const TemplateContainer = styled.div<{ lines: number }>`
    width: 100%;
    position: relative;
    height: ${({ lines }) => (lines + 1) * DEFAULT_LINEHEIGHT}px;
    border-radius: ${Border.radius.large};
    padding: 1px 0;
`
interface TaskTemplateProps {
    isShadow?: boolean
    children: React.ReactNode
    lines?: number
}
const TaskTemplate = forwardRef<HTMLDivElement, TaskTemplateProps>((props: TaskTemplateProps, ref) => {
    return (
        <TemplateContainer ref={ref} lines={props.lines ?? 1}>
            {props.children}
        </TemplateContainer>
    )
})

export default TaskTemplate
