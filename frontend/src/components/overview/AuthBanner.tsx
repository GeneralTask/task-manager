import React from 'react'
import { Colors, Spacing, Typography, Border } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { logos, TLogoImage } from '../../styles/images'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { openPopupWindow } from '../../utils/auth'

const BannerContainer = styled.div`
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid ${Colors.gtColor.secondary};
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
    authorization_url: string
    name: string
    logo: TLogoImage
}

const AuthBanner = ({ authorization_url, name, logo }: AuthBannerProps) => {
    const { refetch } = useGetLinkedAccounts()
    const { refetch: refetchViews } = useGetOverviewViews()

    const onWindowClose = () => {
        const timer = setInterval(() => {
            clearInterval(timer)
            refetch()
            refetchViews()
        }, 10)
    }
    return (
        <BannerContainer>
            <IconContainer>
                <Icon size="small" source={logos[logo]} />
                <Title>{`Connect ${name} to General Task`}</Title>
            </IconContainer>
            <ConnectButton
                value="Connect"
                color={Colors.gtColor.primary}
                onClick={() => openPopupWindow(authorization_url, onWindowClose)}
            />
        </BannerContainer>
    )
}

export default AuthBanner
