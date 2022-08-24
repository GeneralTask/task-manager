import React from 'react'
import { Icon } from '../atoms/Icon'
import { TPullRequest } from '../../utils/types'
import { icons, logos } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { Status } from '../pull-requests/styles'
import BranchName from '../pull-requests/BranchName'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.light};
    min-width: 300px;
    padding: ${Spacing.padding._40} ${Spacing.padding._16} ${Spacing.padding._16};
`
const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 50px;
`
const TitleContainer = styled.div`
    background-color: inherit;
    color: ${Colors.text.black};
    font: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    margin-bottom: ${Spacing.margin._16};
    ${Typography.subtitle};
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const MarginRight8 = styled.div`
    margin-right: ${Spacing.margin._8};
`
const MaxWidth200 = styled.div`
    max-width: 200px;
`
const InfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin._8};
    align-items: center;
    color: ${Colors.text.light};
    margin-bottom: ${Spacing.margin._8};
    ${Typography.bodySmall};
`

interface PullRequestDetailsProps {
    pullRequest: TPullRequest
}
const PullRequestDetails = ({ pullRequest }: PullRequestDetailsProps) => {
    const { title, status, deeplink, branch } = pullRequest

    return (
        <DetailsViewContainer data-testid="details-view-container">
            <DetailsTopContainer>
                <MarginRight8>
                    <Icon icon={logos.github} size="small" color={Colors.icon.black} />
                </MarginRight8>
                <MarginLeftAuto>
                    <NoStyleAnchor href={deeplink} target="_blank" rel="noreferrer">
                        <GTButton
                            styleType="secondary"
                            value="Open in GitHub"
                            icon={icons.external_link}
                            iconColor="black"
                        />
                    </NoStyleAnchor>
                </MarginLeftAuto>
            </DetailsTopContainer>
            <TitleContainer>{title}</TitleContainer>
            <InfoContainer>
                <Status type={status.color}>{status.text}</Status>
                <MaxWidth200>
                    <BranchName name={branch} />
                </MaxWidth200>
            </InfoContainer>
        </DetailsViewContainer>
    )
}

export default PullRequestDetails
