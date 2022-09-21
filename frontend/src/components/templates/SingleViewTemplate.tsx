import { useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import styled from 'styled-components'
import { dismissToast } from '../../utils/toast'
import DragLayer from '../molecules/DragLayer'

const SingleViewContainer = styled.div`
    width: 100vw;
    height: 100vh;
`

interface SingleViewTemplateProps {
    children: React.ReactNode
}
const SingleViewTemplate = ({ children }: SingleViewTemplateProps) => {
    useEffect(() => {
        dismissToast()
    }, [])
    return (
        <DndProvider backend={HTML5Backend}>
            <SingleViewContainer>{children}</SingleViewContainer>
            <DragLayer />
        </DndProvider>
    )
}

export default SingleViewTemplate
