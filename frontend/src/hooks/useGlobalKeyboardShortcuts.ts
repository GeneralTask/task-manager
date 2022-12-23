import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useKeyboardShortcut } from '.'

const useGlobalKeyboardShortcuts = () => {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    useKeyboardShortcut(
        'enterFocusMode',
        useCallback(() => {
            if (pathname !== '/focus-mode') navigate('/focus-mode')
        }, [pathname])
    )
    useKeyboardShortcut(
        'goToNotesPage',
        useCallback(() => navigate('/notes'), [])
    )
    useKeyboardShortcut(
        'goToOverviewPage',
        useCallback(() => navigate('/overview'), [])
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
        'goToRecurringTasksPage',
        useCallback(() => navigate('/recurring-tasks'), [])
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

export default useGlobalKeyboardShortcuts
