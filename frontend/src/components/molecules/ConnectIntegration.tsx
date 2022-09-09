import { useState } from 'react'
import styled from 'styled-components'
import { FIVE_SECOND_TIMEOUT } from '../../constants'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import { TSupportedType } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTShadowContainer from '../atoms/GTShadowContainer'
import { Icon } from '../atoms/Icon'

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
    type: 'github' | 'google_calendar'
}

const ConnectIntegration = ({ type }: ConnectIntegrationProps) => {
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
                    authUrl: getAuthorizationUrl(supportedTypes || [], 'Google'),
                }
            default:
                return { icon: null, name: null, authUrl: null }
        }
    })()
    let title: string | undefined = undefined
    if (userIsConnecting) {
        if (type === 'github') {
            title = 'Connecting to GitHub...'
        } else if (type === 'google_calendar') {
            title = 'Connecting to Google Calendar...'
        }
    } else {
        if (type === 'github') {
            title = 'Connect to GitHub'
        } else if (type === 'google_calendar') {
            title = 'Google Calendar'
        }
    }

    const hideConnectButton = userIsConnecting && type === 'google_calendar'

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
                <Icon icon={icon} size="xSmall" color={Colors.icon.black} />
                <Text>{title}</Text>
            </IconAndText>
            {!hideConnectButton && (
                <GTButton
                    disabled={userIsConnecting}
                    value="Connect"
                    color={Colors.gtColor.primary}
                    size="small"
                    onClick={onClick}
                />
            )}
        </Container>
    )
}

export default ConnectIntegration
