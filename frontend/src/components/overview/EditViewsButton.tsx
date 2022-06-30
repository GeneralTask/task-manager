import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Colors, Shadows, Spacing, Border } from '../../styles'
import { icons } from '../../styles/images'
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

const EditViewsButton = () => {
    const [pageState, setPageState] = useState<'NONE' | 'EDIT' | 'ADD'>('NONE')
    const openModal = () => {
        setPageState('EDIT')
    }
    const handleClose = useCallback(() => setPageState('NONE'), []) // callback so that modal components do not re-render
    return (
        <>
            <Button onClick={openModal}>
                <Icon source={icons.gear} size="small" />
                Edit Views
            </Button>
            <EditViewsModal isOpen={pageState === 'EDIT'} onClose={handleClose} />
            {pageState === 'ADD' && <div>Add a new view here xD</div>}
        </>
    )
}

export default EditViewsButton
