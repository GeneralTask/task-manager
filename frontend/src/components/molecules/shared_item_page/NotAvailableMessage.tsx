import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE } from '../../../constants'
import getEnvVars from '../../../environment'
import useAnalyticsEventTracker from '../../../hooks/useAnalyticsEventTracker'
import { Spacing } from '../../../styles'
import Flex from '../../atoms/Flex'
import NoStyleAnchor from '../../atoms/NoStyleAnchor'
import GTButton from '../../atoms/buttons/GTButton'
import { BodyLarge, TitleLarge } from '../../atoms/typography/Typography'

const FlexMargin8Top = styled(Flex)`
    margin-top: ${Spacing._8};
`

interface NotAvailableMessageProps {
    sharedType: 'Notes' | 'Tasks'
}
const NotAvailableMessage = ({ sharedType }: NotAvailableMessageProps) => {
    const GALog = useAnalyticsEventTracker(sharedType)
    const navigate = useNavigate()
    const type = sharedType === 'Notes' ? 'note' : 'task'
    const isLoggedIn = !!Cookies.get(AUTHORIZATION_COOKE)

    const getTitle = () => {
        if (isLoggedIn) {
            return `This ${type} is not available`
        }
        return `Sign in to view this ${type}`
    }
    const getBody = () => {
        if (isLoggedIn) {
            return `If you need access to this ${type}, please reach out to the person who sent it.`
        }
        return `To view this ${type}, you need to sign in or sign up for an account. Please make sure that the email address you use to log in matches the one that the ${type} was shared with.`
    }
    return (
        <Flex column gap={Spacing._16}>
            <TitleLarge>{getTitle()}</TitleLarge>
            <BodyLarge>{getBody()}</BodyLarge>
            <FlexMargin8Top gap={Spacing._8}>
                {isLoggedIn ? (
                    <GTButton
                        styleType="primary"
                        value="Back to General Task"
                        onClick={() => {
                            GALog('Button click', 'Back to General Task')
                            navigate('/')
                        }}
                    />
                ) : (
                    <>
                        <NoStyleAnchor href={getEnvVars().REACT_APP_TRY_SIGN_UP_URL}>
                            <GTButton styleType="primary" value="Sign In to General Task" />
                        </NoStyleAnchor>
                        <NoStyleAnchor href={getEnvVars().REACT_APP_TRY_BASE_URL}>
                            <GTButton styleType="secondary" value="Learn more about General Task" />
                        </NoStyleAnchor>
                    </>
                )}
            </FlexMargin8Top>
        </Flex>
    )
}

export default NotAvailableMessage
