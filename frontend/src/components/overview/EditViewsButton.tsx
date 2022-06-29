import React, { useState } from 'react'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { Colors, Shadows, Spacing, Border } from '../../styles'
import { icons } from '../../styles/images'
import { ModalEnum } from '../../utils/enums'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Icon } from '../atoms/Icon'
import EditViewsModal from './EditViewsModal'

const Button = styled(NoStyleButton)`
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._4};
    background-color: ${Colors.white};
    box-shadow: ${Shadows.small};
    color: ${Colors.gray._500};
    padding: ${Spacing.padding._8};
    border-radius: ${Border.radius.small};
    margin: ${Spacing.margin._16} 0;
`

type TPageState = 'none' | 'edit' | 'add'

const EditViewsButton = () => {
    const [pageState, setPageState] = useState<TPageState>('none')
    const dispatch = useAppDispatch()
    const openModal = () => {
        dispatch(setShowModal(ModalEnum.OVERVIEW))
        setPageState('edit')
    }
    // const onClose = () => {
    //     setPageState('none')
    // }
    return (
        <>
            <Button onClick={openModal}>
                <Icon source={icons.gear} size="small" />
                Edit Views
            </Button>
            {pageState === 'edit' && <EditViewsModal />}
            {pageState === 'add' && <div>Add a new view here xD</div>}
        </>
    )
}

export default EditViewsButton
