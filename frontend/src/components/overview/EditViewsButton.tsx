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

type TPageState = 'none' | 'edit' | 'add'

const EditViewsButton = () => {
    const [pageState, setPageState] = useState<TPageState>('none')
    const openModal = () => {
        setPageState('edit')
    }
    const handleClose = useCallback(() => setPageState('none'), []) // callback so that modal components do not re-render
    return (
        <>
            <Button onClick={openModal}>
                <Icon source={icons.gear} size="small" />
                Edit Views
            </Button>
            <EditViewsModal isOpen={pageState === 'edit'} onClose={handleClose} />
            {pageState === 'add' && <div>Add a new view here xD</div>}
        </>
    )
}

export default EditViewsButton
