import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../../constants'
import { useAuthWindow, useToast } from '../../../hooks'
import { useGetSupportedTypes } from '../../../services/api/settings.hooks'
import { logos } from '../../../styles/images'

const useConnectGoogleAccountToast = () => {
    const { openAuthWindow } = useAuthWindow()
    const { data: supportedTypes } = useGetSupportedTypes()
    const toast = useToast()
    const googleSupportedType = supportedTypes?.find((type) => type.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)

    return () => {
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
        toast.show(toastProps, {
            autoClose: 2000,
            pauseOnFocusLoss: false,
        })
    }
}

export default useConnectGoogleAccountToast
