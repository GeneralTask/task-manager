import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useKeyboardShortcut } from '.'

const useGlobalShortcuts = () => {
    const navigate = useNavigate()
    useKeyboardShortcut(
        'enterFocusMode',
        useCallback(() => navigate('/focus-mode'), [])
    )
    useKeyboardShortcut(
        'goToOverviewPage',
        useCallback(() => navigate('/overview'), [])
    )
    useKeyboardShortcut(
        'goToGithubPRsPage',
        useCallback(() => navigate('/pull-requests'), [])
    )
    useKeyboardShortcut(
        'goToLinearPage',
        useCallback(() => navigate('/linear'), [])
    )
    useKeyboardShortcut(
        'goToSlackPage',
        useCallback(() => navigate('/slack'), [])
    )
    useKeyboardShortcut(
        'goToTaskInbox',
        useCallback(() => navigate('/tasks'), [])
    )
    useKeyboardShortcut(
        'dismissNotifications',
        useCallback(() => {
            toast.dismiss()
        }, [toast])
    )
}

export default useGlobalShortcuts
