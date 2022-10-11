import { useCallback, useState } from 'react'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import AddListsModal from './AddListsModal'
import EditListsModal from './EditListsModal'

type TPageState = 'NONE' | 'ADD' | 'EDIT'

const EditListsButtons = () => {
    const [pageState, setPageState] = useState<TPageState>('NONE')

    const handleClose = useCallback(() => setPageState('NONE'), []) // callback so that modal components do not re-render
    return (
        <>
            <GTButton styleType="secondary" icon={icons.plus} onClick={() => setPageState('ADD')} value="Add Lists" />
            <GTButton
                styleType="secondary"
                icon={icons.domino}
                onClick={() => setPageState('EDIT')}
                value="Edit Lists"
            />

            <AddListsModal isOpen={pageState === 'ADD'} onClose={handleClose} />
            <EditListsModal isOpen={pageState === 'EDIT'} onClose={handleClose} />
        </>
    )
}

export default EditListsButtons
