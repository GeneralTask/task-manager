import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Dimensions } from '../../styles'

const TemplateContainer = styled.div`
    width: 100%;
    position: relative;
    height: ${Dimensions.TASK_HEIGHT};
    box-sizing: border-box;
    border-radius: ${Border.radius.large};
    padding: 1px 0;
    margin: 2px 0;
`
interface TaskTemplateProps {
    isShadow?: boolean
    children: React.ReactNode
}
const TaskTemplate = forwardRef<HTMLDivElement, TaskTemplateProps>((props: TaskTemplateProps, ref) => {
    return <TemplateContainer ref={ref}>{props.children}</TemplateContainer>
})

export default TaskTemplate
