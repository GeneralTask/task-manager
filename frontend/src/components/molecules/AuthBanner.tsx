import React from 'react'
import { Colors } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { logos } from '../../styles/images'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'

const BannerContainer = styled.div`
    box-sizing: border-box;
    border: 1px solid ${Colors.purple._3};
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px;
`
const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
`

const AuthButtonContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: flex-end;
    padding: 4px 8px;
    gap: 4px;

    width: 74px;
    height: 28px;
`

const Title = styled.span`
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
`

interface AuthBannerProps {
    name: string
    authorization_url: string
}

const AuthBanner = (props: AuthBannerProps) => {
    const { refetch } = useGetLinkedAccounts()
    const { refetch: refetchViews } = useGetOverviewViews()

    function openAuthWindow() {
        const AUTH_WINDOW_WIDTH = 960
        const AUTH_WINDOW_HEIGHT = 640

        const left = (screen.width - AUTH_WINDOW_WIDTH) / 2
        const top = (screen.height - AUTH_WINDOW_HEIGHT) / 4

        const win = window.open(
            props.authorization_url,
            props.name,
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

    return (
        <BannerContainer>
            <IconContainer>
                <Icon size="small" source={logos[props.name.toLocaleLowerCase()]} />
                <Title>{`Connect ${props.name} to General Task`}</Title>
            </IconContainer>
            <AuthButtonContainer>
                <GTButton value="Connect" color={Colors.purple._1} onClick={() => openAuthWindow()} />
            </AuthButtonContainer>
        </BannerContainer>
    )
}

export default AuthBanner
