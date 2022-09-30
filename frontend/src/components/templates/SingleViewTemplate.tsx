import { useEffect } from 'react'
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
        <>
            <SingleViewContainer>{children}</SingleViewContainer>
            <DragLayer />
        </>
    )
}

export default SingleViewTemplate
