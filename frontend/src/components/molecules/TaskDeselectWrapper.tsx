import React, { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { setSelectedItemId } from '../../redux/tasksPageSlice'

const DeselectContainer = styled.div`
    width: 100%;
    height: 100%;
`

const withTaskDeselect = <P extends object>(Component: React.ComponentType<P>) => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const params = useParams()
    const hideDetailsView = useCallback(() => navigate(`/tasks/${params.section}`), [params])

    const onClickHandler = () => {
        dispatch(setSelectedItemId(''))
        hideDetailsView()
    }

    return ({ ...props }) => {
        return (
            <DeselectContainer onClick={onClickHandler}>
                <Component {...(props as P)} />
            </DeselectContainer>
        )
    }
}

export default withTaskDeselect
