import { useLocalStorage } from 'usehooks-ts'
import { useGetUserInfo } from '../services/api/user-info.hooks'

interface UsePreviewModeOutput {
    isPreviewMode: boolean
    toggle: () => void
    enable: () => void
    disable: () => void
}

function usePreviewMode(defaultValue?: boolean): UsePreviewModeOutput {
    const { data: userInfo } = useGetUserInfo()
    const [isPreviewMode, setPreviewMode] = useLocalStorage<boolean>('previewMode', defaultValue ?? false)

    return {
        isPreviewMode: isPreviewMode && (userInfo?.is_employee ?? false),
        toggle: () => setPreviewMode((prev) => !prev),
        enable: () => setPreviewMode(true),
        disable: () => setPreviewMode(false),
    }
}

export default usePreviewMode
