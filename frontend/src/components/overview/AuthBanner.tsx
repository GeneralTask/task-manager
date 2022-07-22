import React from 'react'
import { Colors, Spacing, Typography, Border } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { logos } from '../../styles/images'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'

const BannerContainer = styled.div`
    box-sizing: border-box;
    border: 1px solid ${Colors.purple._3};
    border-radius: ${Border.radius.small};
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._12} ${Spacing.padding._16};
`
const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.padding._12};
`
const AuthButtonContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: flex-end;
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    gap: ${Spacing.padding._4};

    width: 74px;
    height: 28px;
`
const Title = styled.span`
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._400};
    line-height: ${Typography.xSmall.lineHeight};
`

interface AuthBannerProps {
    name: string
    authorization_url: string
}

const openAuthWindow = (
    authorizationUrl: string,
    sourceName: string,
    refetch: () => void,
    refetchViews: () => void
) => {
    const AUTH_WINDOW_WIDTH = 960
    const AUTH_WINDOW_HEIGHT = 640

    const left = (screen.width - AUTH_WINDOW_WIDTH) / 2
    const top = (screen.height - AUTH_WINDOW_HEIGHT) / 4

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

const AuthBanner = (props: AuthBannerProps) => {
    const { refetch } = useGetLinkedAccounts()
    const { refetch: refetchViews } = useGetOverviewViews()

    return (
        <BannerContainer>
            <IconContainer>
                <Icon size="small" source={logos[props.name.toLocaleLowerCase()]} />
                <Title>{`Connect ${props.name} to General Task`}</Title>
            </IconContainer>
            <AuthButtonContainer>
                <GTButton
                    value="Connect"
                    color={Colors.purple._1}
                    onClick={() => openAuthWindow(props.authorization_url, props.name, refetch, refetchViews)}
                />
            </AuthButtonContainer>
        </BannerContainer>
    )
}

export default AuthBanner
