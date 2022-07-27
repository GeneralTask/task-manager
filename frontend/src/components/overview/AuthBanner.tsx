import React from 'react'
import { Colors, Spacing, Typography, Border } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { logos, TLogoImage } from '../../styles/images'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { TSourcesResult, TSupportedView } from '../../utils/types'
import { openAuthWindow } from '../../utils/auth'

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
    sources: TSourcesResult[] | TSupportedView[]
    sourceName: string
    logo: TLogoImage
}

const AuthBanner = ({ sources, sourceName, logo }: AuthBannerProps) => {
    const { refetch } = useGetLinkedAccounts()
    const { refetch: refetchViews } = useGetOverviewViews()

    return (
        <BannerContainer>
            <IconContainer>
                <Icon size="small" source={logos[logo]} />
                <Title>{`Connect ${sourceName} to General Task`}</Title>
            </IconContainer>
            <ConnectButton
                value="Connect"
                color={Colors.gtColor.primary}
                onClick={() => openAuthWindow(sourceName, sources, refetch, refetchViews)}
            />
        </BannerContainer>
    )
}

export default AuthBanner
