import styled from 'styled-components'
import { GOOGLE_AUTH_ROUTE, GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import getEnvVars from '../../environment'
import useAuthWindow from '../../hooks/useAuthWindow'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TLinkedAccountName, TSupportedType } from '../../utils/types'
import GTShadowContainer from '../atoms/GTShadowContainer'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'

const Container = styled(GTShadowContainer)`
    display: flex;
    align-items: center;
    ${Typography.bodySmall};
    box-sizing: border-box;
    height: fit-content;
`
const Text = styled.span`
    padding: ${Spacing._4} ${Spacing._8};
`
const IconAndText = styled.span`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    margin-right: auto;
`

const getAuthorizationUrl = (supportedTypes: TSupportedType[], name: TLinkedAccountName) => {
    const supportedType = supportedTypes.find((type) => type.name === name)
    if (!supportedType) return null

    if (name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)
        return `${getEnvVars().REACT_APP_FRONTEND_BASE_URL}/${GOOGLE_AUTH_ROUTE}?authUrl=${
            supportedType.authorization_url
        }`
    return supportedType.authorization_url
}

interface ConnectIntegrationProps {
    type: 'github' | 'google_calendar' | 'slack' | 'linear'
    reconnect?: boolean
}

const ConnectIntegration = ({ type, reconnect = false }: ConnectIntegrationProps) => {
    const { data: supportedTypes } = useGetSupportedTypes()
    const { openAuthWindow, isAuthWindowOpen } = useAuthWindow()
    const { icon, name, authUrl } = (() => {
        switch (type) {
            case 'github':
                return {
                    icon: logos.github,
                    name: 'GitHub',
                    authUrl: getAuthorizationUrl(supportedTypes || [], 'GitHub'),
                }
            case 'google_calendar':
                return {
                    icon: logos.gcal,
                    name: 'Google Calendar',
                    authUrl: getAuthorizationUrl(supportedTypes || [], GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME),
                }
            case 'slack':
                return {
                    icon: logos.slack,
                    name: 'Slack',
                    authUrl: getAuthorizationUrl(supportedTypes || [], 'Slack'),
                }
            case 'linear':
                return {
                    icon: logos.linear,
                    name: 'Linear',
                    authUrl: getAuthorizationUrl(supportedTypes || [], 'Linear'),
                }
            default:
                return { icon: null, name: null, authUrl: null }
        }
    })()

    const title = isAuthWindowOpen ? `Connecting to ${name}...` : `Connect to ${name}`

    const isGCal = type === 'google_calendar'
    const hideConnectButton = isGCal && isAuthWindowOpen

    const onClick = () => {
        if (!authUrl) return
        openAuthWindow({ url: authUrl })
    }

    if (!icon || !name || !authUrl || !title) return null
    return (
        <Container>
            <IconAndText>
                <Icon icon={reconnect ? icons.warning : icon} color={reconnect ? 'red' : 'black'} />
                <Text>{reconnect ? 'This account needs to be re-linked.' : isGCal ? name : title}</Text>
            </IconAndText>
            {!hideConnectButton && (
                <GTButton
                    disabled={isAuthWindowOpen}
                    value={reconnect ? 'Re-link account' : 'Connect'}
                    color={Colors.gtColor.primary}
                    size="small"
                    onClick={onClick}
                />
            )}
        </Container>
    )
}

export default ConnectIntegration
