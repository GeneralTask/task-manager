import React, { useCallback, useState } from 'react'
import GTButton from '../atoms/buttons/GTButton'
import AddViewsModal from './AddViewsModal'
import EditViewsModal from './EditViewsModal'

type TPageState = 'NONE' | 'ADD' | 'REORDER'

const EditViewsButtons = () => {
    const [pageState, setPageState] = useState<TPageState>('NONE')

    const handleClose = useCallback(() => setPageState('NONE'), []) // callback so that modal components do not re-render
    return (
        <>
            <GTButton styleType="secondary" iconSource="plus" onClick={() => setPageState('ADD')} value="Add view" />
            <GTButton
                styleType="secondary"
                iconSource="domino"
                onClick={() => setPageState('REORDER')}
                value="Reorder views"
            />

            <AddViewsModal isOpen={pageState === 'ADD'} onClose={handleClose} />
            <EditViewsModal isOpen={pageState === 'REORDER'} onClose={handleClose} />
        </>
    )
}

export default EditViewsButtons
