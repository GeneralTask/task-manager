import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../../constants'
import { useAuthWindow, usePreviewMode, useToast } from '../../../hooks'
import { useGetSupportedTypes } from '../../../services/api/settings.hooks'
import { logos } from '../../../styles/images'
import { toast } from '../../molecules/toast/utils'

const useConnectGoogleAccountToast = () => {
    const { openAuthWindow } = useAuthWindow()
    const { data: supportedTypes } = useGetSupportedTypes()
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()
    const googleSupportedType = supportedTypes?.find((type) => type.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)

    return () => {
        if (isPreviewMode) {
            toast('Connect your Google account to create events from tasks.', {
                actions: {
                    styleType: 'secondary',
                    value: 'Connect',
                    onClick: () => {
                        openAuthWindow({ url: googleSupportedType?.authorization_url, isGoogleSignIn: true })
                    },
                    icon: logos.gcal,
                },
            })
        } else {
            const toastProps = {
                title: '',
                message: 'Connect your Google account to create events from tasks.',
                rightAction: {
                    icon: logos.gcal,
                    label: 'Connect',
                    onClick: () => {
                        openAuthWindow({ url: googleSupportedType?.authorization_url, isGoogleSignIn: true })
                    },
                },
            }
            oldToast.show(toastProps, {
                autoClose: 2000,
                pauseOnFocusLoss: false,
            })
        }
    }
}

export default useConnectGoogleAccountToast
