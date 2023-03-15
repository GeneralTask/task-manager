import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE, LOGIN_URL } from '../../../constants'
import { useAuthWindow } from '../../../hooks'
import useAnalyticsEventTracker from '../../../hooks/useAnalyticsEventTracker'
import { Spacing } from '../../../styles'
import { buttons } from '../../../styles/images'
import GTButton from '../../atoms/buttons/GTButton'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'

const Logo = styled.img`
    width: 193px;
`
export const HeaderContainer = styled.div`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${Spacing._24};
    width: 750px;
    z-index: 10;
`
const SignInButton = styled(NoStyleButton)`
    width: 200px;
`
const GoogleImage = styled.img`
    width: 100%;
`

interface SharedItemHeaderProps {
    sharedType: 'Notes' | 'Tasks'
}
const SharedItemHeader = ({ sharedType }: SharedItemHeaderProps) => {
    const GALog = useAnalyticsEventTracker(sharedType)
    useEffect(() => {
        if (sharedType === 'Notes') {
            GALog('Page view', 'Shared Note View')
        } else if (sharedType === 'Tasks') {
            GALog('Page view', 'Shared Task View')
        }
    }, [])

    const { openAuthWindow } = useAuthWindow()
    const navigate = useNavigate()
    const isLoggedIn = !!Cookies.get(AUTHORIZATION_COOKE)

    return (
        <HeaderContainer>
            <NoStyleButton
                onClick={() => {
                    GALog('Button click', 'Logo')
                    navigate('/')
                }}
            >
                <Logo src="/images/gt-logo-black-on-white.svg" />
            </NoStyleButton>
            {isLoggedIn ? (
                <GTButton
                    styleType="secondary"
                    value="Back to General Task"
                    onClick={() => {
                        GALog('Button click', 'Back to General Task')
                        navigate('/')
                    }}
                />
            ) : (
                <SignInButton
                    onClick={() => {
                        GALog('Button click', 'Sign in with Google')
                        openAuthWindow({ url: LOGIN_URL, logEvent: false, closeOnCookieSet: true })
                    }}
                >
                    <GoogleImage src={buttons.google_sign_in} />
                </SignInButton>
            )}
        </HeaderContainer>
    )
}

export default SharedItemHeader
