import React from 'react'
import { Colors, Spacing, Typography, Border } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { logos, TLogoImage } from '../../styles/images'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { TSourcesResult } from '../../utils/types'

const BannerContainer = styled.div`
    box-sizing: border-box;
    border: 1px solid ${Colors.gtColor.secondary};
    border-radius: ${Border.radius.small};
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._12} ${Spacing.padding._16};
    height: 60px;
`
const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.padding._12};
`
const ConnectButton = styled(GTButton)`
    height: 28px;
`
const Title = styled.span`
    ${Typography.bodySmall};
`

interface AuthBannerProps {
    source: TSourcesResult
    logo: TLogoImage
}

const AUTH_WINDOW_WIDTH = 960
const AUTH_WINDOW_HEIGHT = 640

const left = (screen.width - AUTH_WINDOW_WIDTH) / 2
const top = (screen.height - AUTH_WINDOW_HEIGHT) / 4

const openAuthWindow = (
    authorizationUrl: string,
    sourceName: string,
    refetch: () => void,
    refetchViews: () => void
) => {
    const win = window.open(
        authorizationUrl,
        sourceName,
        `height=${AUTH_WINDOW_HEIGHT},width=${AUTH_WINDOW_WIDTH},top=${top},left=${left}toolbar=no,menubar=no,scrollbars=no,location=no,status=no`
    )

    if (win != null) {
        const timer = setInterval(() => {
            if (win.closed) {
                clearInterval(timer)
                refetch()
                refetchViews()
            }
        }, 10)
    }
}

const AuthBanner = ({ source, logo }: AuthBannerProps) => {
    const { refetch } = useGetLinkedAccounts()
    const { refetch: refetchViews } = useGetOverviewViews()

    return (
        <BannerContainer>
            <IconContainer>
                <Icon size="small" source={logos[logo]} />
                <Title>{`Connect ${source.name} to General Task`}</Title>
            </IconContainer>
            <ConnectButton
                value="Connect"
                color={Colors.gtColor.primary}
                onClick={() => openAuthWindow(source.authorization_url, source.name, refetch, refetchViews)}
            />
        </BannerContainer>
    )
}

export default AuthBanner
