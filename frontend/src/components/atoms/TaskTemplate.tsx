import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Shadows } from '../../styles'

const TemplateContainer = styled.div`
    width: 100%;
    position: relative;
    height: 34px;
    border-radius: 4px;
    box-shadow: ${Shadows.xSmall};
    padding: 1px 0;
`
interface TaskTemplateProps {
    isShadow?: boolean
    children: React.ReactNode
}
const TaskTemplate = forwardRef<HTMLDivElement, TaskTemplateProps>((props: TaskTemplateProps, ref) => {
    return (
        <TemplateContainer ref={ref}>
            {props.children}
        </TemplateContainer>
    )
})

export default TaskTemplate
