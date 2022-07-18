import React from 'react'
import { Icon } from '../atoms/Icon'
import { TPullRequest } from '../../utils/types'
import { logos } from '../../styles/images'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { Status } from '../pull-requests/styles'
import BranchName from '../pull-requests/BranchName'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
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
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.large.fontSize};
    font-weight: ${Typography.weight._600};
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    margin-bottom: ${Spacing.margin._16};
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
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._700};
    margin-bottom: ${Spacing.margin._8};
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
                    <Icon source={logos.github} size="small" />
                </MarginRight8>
                <MarginLeftAuto>
                    <NoStyleAnchor href={deeplink} target="_blank" rel="noreferrer">
                        <RoundedGeneralButton
                            textStyle="dark"
                            value="Open in GitHub"
                            hasBorder
                            iconSource="external_link"
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
