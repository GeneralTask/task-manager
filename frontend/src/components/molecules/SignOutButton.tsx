import { useCallback, useState } from 'react'
import { authSignOut } from '../../utils/auth'
import GTModal from '../atoms/GTModal'
import GTButton from '../atoms/buttons/GTButton'

const SignOutButton = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)

    const handleClose = useCallback(() => setModalIsOpen(false), []) // callback so that modal components do not re-render
    const handleConfirm = useCallback(() => authSignOut(), [])
    return (
        <>
            <GTButton styleType="secondary" onClick={() => setModalIsOpen(true)} value="Sign Out" />
            <GTModal
                isOpen={modalIsOpen}
                title="Sign out?"
                onClose={handleClose}
                leftButtons={<GTButton value="Go Back" styleType="secondary" onClick={handleClose} />}
                rightButtons={<GTButton value="Sign Out" styleType="primary" onClick={handleConfirm} />}
                type="dialog"
            />
        </>
    )
}

export default SignOutButton
