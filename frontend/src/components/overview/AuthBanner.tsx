import React from 'react'
import { Colors, Spacing, Typography, Border } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { logos, TLogoImage } from '../../styles/images'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetOverviewViews, useGetSupportedViews } from '../../services/api/overview.hooks'
import { openPopupWindow } from '../../utils/auth'
import { useFetchExternalTasks } from '../../services/api/tasks.hooks'
import { useFetchPullRequests } from '../../services/api/pull-request.hooks'

const BannerContainer = styled.div<{ hasBorder: boolean }>`
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid;
    border-color: ${(props) => (props.hasBorder ? Colors.gtColor.secondary : 'transparent')};
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
    authorizationUrl: string
    name: string
    logo: TLogoImage
    hasBorder: boolean
}

const AuthBanner = ({ authorizationUrl, name, logo, hasBorder }: AuthBannerProps) => {
    const { refetch: refetchViews } = useGetOverviewViews()
    const { refetch: refetchSupportedViews } = useGetSupportedViews()
    const { refetch: fetchExternalTasks } = useFetchExternalTasks()
    const { refetch: fetchPullRequests } = useFetchPullRequests()

    const onWindowClose = async () => {
        refetchSupportedViews()
        await Promise.all([fetchExternalTasks(), fetchPullRequests()])
        refetchViews()
    }

    return (
        <BannerContainer hasBorder={hasBorder}>
            <IconContainer>
                <Icon size="small" source={logos[logo]} />
                <Title>{`Connect ${name} to General Task`}</Title>
            </IconContainer>
            <ConnectButton
                value="Connect"
                color={Colors.gtColor.primary}
                onClick={() => openPopupWindow(authorizationUrl, onWindowClose)}
            />
        </BannerContainer>
    )
}

export default AuthBanner
