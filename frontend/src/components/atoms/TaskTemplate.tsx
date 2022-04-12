import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Shadows } from '../../styles'

const TemplateContainer = styled.div<{ lines: number }>`
    width: 100%;
    position: relative;
    height: ${({ lines }) => (lines - 1) * 17 + 34}px;
    border-radius: 4px;
    box-shadow: ${Shadows.xSmall};
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
