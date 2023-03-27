import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast as oldToast } from 'react-toastify'
import { useKeyboardShortcut, usePreviewMode } from '.'

const useGlobalKeyboardShortcuts = () => {
    const { isPreviewMode } = usePreviewMode()
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
        'goToJiraPage',
        useCallback(() => navigate('/jira'), [])
    )
    useKeyboardShortcut(
        'goToLinearPage',
        useCallback(() => navigate('/linear'), []),
        !isPreviewMode
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
            oldToast.dismiss()
            toast.dismiss()
        }, [oldToast, toast])
    )
}

export default useGlobalKeyboardShortcuts
