import styled from 'styled-components'
import { GOOGLE_AUTH_ROUTE, GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import getEnvVars from '../../environment'
import { useAuthWindow } from '../../hooks'
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
    justify-content: space-between;
    ${Typography.deprecated_bodySmall};
    box-sizing: border-box;
    height: fit-content;
`
const Text = styled.span`
    padding: ${Spacing._4} ${Spacing._8};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`
const ButtonWrapper = styled.div`
    margin-left: auto;
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
    type: 'github' | 'google_calendar' | 'slack' | 'linear' | 'jira'
    reconnect?: boolean
    reauthorizeAccountName?: string
}

const ConnectIntegration = ({ type, reconnect = false, reauthorizeAccountName }: ConnectIntegrationProps) => {
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
            case 'jira':
                return {
                    icon: logos.jira,
                    name: 'Jira',
                    authUrl: getAuthorizationUrl(supportedTypes || [], 'Jira'),
                }
            default:
                return { icon: null, name: null, authUrl: null }
        }
    })()

    const getTitle = () => {
        if (reauthorizeAccountName) return reauthorizeAccountName
        if (isAuthWindowOpen) return `Connecting to ${name}...`
        if (reconnect) return 'This account needs to be re-linked.'
        if (type === 'google_calendar') return name
        else return `Connect to ${name}`
    }

    const getButtonLabel = () => {
        if (isAuthWindowOpen && reauthorizeAccountName) return 'Authorizing...'
        if (isAuthWindowOpen) return 'Connecting...'
        if (reauthorizeAccountName) return 'Authorize'
        if (reconnect) return 'Re-link account'
        return 'Connect'
    }

    const onClick = () => {
        if (!authUrl) return
        openAuthWindow({ url: authUrl })
    }

    if (!icon || !name || !authUrl) return null
    return (
        <Container>
            <Icon icon={reconnect ? icons.warning : icon} color={reconnect ? 'red' : 'black'} />
            <Text>{getTitle()}</Text>
            <ButtonWrapper>
                <GTButton
                    styleType="primary"
                    disabled={isAuthWindowOpen}
                    value={getButtonLabel()}
                    color={Colors.legacyColors.purple}
                    onClick={onClick}
                />
            </ButtonWrapper>
        </Container>
    )
}

export default ConnectIntegration
