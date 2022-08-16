import React, { useCallback, useState } from 'react'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import AddViewsModal from './AddViewsModal'
import EditViewsModal from './EditViewsModal'

type TPageState = 'NONE' | 'ADD' | 'EDIT'

const EditViewsButtons = () => {
    const [pageState, setPageState] = useState<TPageState>('NONE')

    const handleClose = useCallback(() => setPageState('NONE'), []) // callback so that modal components do not re-render
    return (
        <>
            <GTButton styleType="secondary" icon={icons.plus} onClick={() => setPageState('ADD')} value="Add view" />
            <GTButton
                styleType="secondary"
                icon={icons.domino}
                onClick={() => setPageState('EDIT')}
                value="Edit views"
            />

            <AddViewsModal isOpen={pageState === 'ADD'} onClose={handleClose} />
            <EditViewsModal isOpen={pageState === 'EDIT'} onClose={handleClose} />
        </>
    )
}

export default EditViewsButtons
