import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import AddViewsModal from './AddViewsModal'
import EditViewsModal from './EditViewsModal'

const ButtonMarginBottom = styled.div`
    margin-bottom: ${Spacing.margin._8};
`
type TPageState = 'NONE' | 'EDIT' | 'ADD'

const EditViewsButton = () => {
    const [pageState, setPageState] = useState<TPageState>('NONE')
    const openModal = () => {
        setPageState('EDIT')
    }
    const handleClose = useCallback(() => setPageState('NONE'), []) // callback so that modal components do not re-render
    return (
        <>
            <ButtonMarginBottom>
                <GTButton styleType="secondary" iconSource="gear" onClick={openModal} value="Edit Views" />
            </ButtonMarginBottom>
            <EditViewsModal
                isOpen={pageState === 'EDIT'}
                onClose={handleClose}
                goToAddViewsView={() => setPageState('ADD')}
            />
            <AddViewsModal
                isOpen={pageState === 'ADD'}
                onClose={handleClose}
                goToEditViewsView={() => setPageState('EDIT')}
            />
        </>
    )
}

export default EditViewsButton
