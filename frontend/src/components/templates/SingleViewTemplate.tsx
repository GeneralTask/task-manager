import { useEffect } from 'react'
import styled from 'styled-components'
import { useToast } from '../../hooks'
import DragLayer from '../molecules/DragLayer'

const SingleViewContainer = styled.div`
    width: 100vw;
    height: 100vh;
`

interface SingleViewTemplateProps {
    children: React.ReactNode
}
const SingleViewTemplate = ({ children }: SingleViewTemplateProps) => {
    const toast = useToast()
    useEffect(() => {
        toast.dismiss()
    }, [])
    return (
        <>
            <SingleViewContainer>{children}</SingleViewContainer>
            <DragLayer />
        </>
    )
}

export default SingleViewTemplate
