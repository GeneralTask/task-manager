import React, { useState } from 'react'
import styled from 'styled-components'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import { TSupportedType } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTContainer from '../atoms/GTContainer'
import { Icon } from '../atoms/Icon'

const Container = styled(GTContainer)`
    display: flex;
    align-items: center;
    ${Typography.bodySmall}
    box-sizing: border-box;
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
            default:
                return { icon: null, name: null, authUrl: null }
        }
    })()
    const title = userIsConnecting ? `Connecting ${name} to General Task...` : `Connect ${name} to General Task`

    const onClick = () => {
        if (!authUrl) return
        setUserIsConnecting(true)
        const onClose = () => {
            refetchStaleQueries()
            setUserIsConnecting(false)
        }
        openPopupWindow(authUrl, onClose)
    }

    if (!icon || !name || !authUrl) return null
    return (
        <Container>
            <IconAndText>
                <Icon icon={icon} size="xSmall" color={Colors.icon.black} />
                {title}
            </IconAndText>
            <GTButton
                disabled={userIsConnecting}
                value="Connect"
                color={Colors.gtColor.primary}
                size="small"
                onClick={onClick}
            />
        </Container>
    )
}

export default ConnectIntegration
