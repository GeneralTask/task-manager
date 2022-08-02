import React, { useCallback, useState } from 'react'
import { authSignOut } from '../../utils/auth'
import GTButton from '../atoms/buttons/GTButton'
import ConfirmDialog from './ConfirmModal'

type TPageState = 'NONE' | 'CONFIRMING'

const SignOutButton = () => {
    const [pageState, setPageState] = useState<TPageState>('NONE')
    const openModal = () => {
        setPageState('CONFIRMING')
    }
    const handleClose = useCallback(() => setPageState('NONE'), []) // callback so that modal components do not re-render
    const handleConfirm = useCallback(() => authSignOut(), [])
    return (
        <>
            <GTButton styleType="secondary" onClick={openModal} value="Sign Out" />
            <ConfirmDialog
                isOpen={pageState === 'CONFIRMING'}
                onClose={handleClose}
                onConfirm={handleConfirm}
                promptText="Sign out?"
                confirmText="Sign Out"
                cancelText="Go Back"
            />
        </>
    )
}

export default SignOutButton
