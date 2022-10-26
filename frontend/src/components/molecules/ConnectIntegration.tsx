import { useState } from 'react'
import styled from 'styled-components'
import { FIVE_SECOND_TIMEOUT, GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import { TSupportedType } from '../../utils/types'
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

const getAuthorizationUrl = (supportedTypes: TSupportedType[], name: string) => {
    const supportedType = supportedTypes.find((type) => type.name === name)
    if (!supportedType) return null
    return supportedType.authorization_url
}

interface ConnectIntegrationProps {
    type: 'github' | 'google_calendar' | 'slack' | 'linear'
    reconnect?: boolean
}

const ConnectIntegration = ({ type, reconnect = false }: ConnectIntegrationProps) => {
    const [userIsConnecting, setUserIsConnecting] = useState(false)
    const refetchStaleQueries = useRefetchStaleQueries()
    const { data: supportedTypes } = useGetSupportedTypes()
    const { icon, name, authUrl } = (() => {
        switch (type) {
            case 'github':
                return {
                    icon: logos.github,
                    name: 'GitHub',
                    authUrl: getAuthorizationUrl(supportedTypes || [], 'Github'),
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

    const title = userIsConnecting ? `Connecting to ${name}...` : `Connect to ${name}`

    const isGCal = type === 'google_calendar'
    const hideConnectButton = isGCal && userIsConnecting

    const onClick = () => {
        if (!authUrl) return
        setUserIsConnecting(true)
        const onClose = () => {
            refetchStaleQueries()
            setTimeout(() => {
                setUserIsConnecting(false)
            }, FIVE_SECOND_TIMEOUT * 1000)
        }
        openPopupWindow(authUrl, onClose)
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
                    disabled={userIsConnecting}
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
