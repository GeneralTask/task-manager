import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import { Eyebrow, Label } from '../atoms/typography/Typography'
import BranchName from '../pull-requests/BranchName'
import { Status } from '../pull-requests/styles'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import PullRequestComment from './pr/PullRequestComment'

const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
`
const TitleContainer = styled.div`
    background-color: inherit;
    color: ${Colors.text.black};
    font: inherit;
    margin: ${Spacing._16} 0;
    ${Typography.subtitle};
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const InfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: ${Spacing._8};
    align-items: center;
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._8};
    ${Typography.bodySmall};
`
const BranchInfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
`
const LinesModified = styled.span<{ color: 'green' | 'red' }>`
    color: ${(props) => Colors.text[props.color]};
    ${Typography.bodySmall};
    ${Typography.bold};
`
const Gap4 = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._4};
`

interface PullRequestDetailsProps {
    pullRequest: TPullRequest
}
const PullRequestDetails = ({ pullRequest }: PullRequestDetailsProps) => {
    const { data: repositories } = useGetPullRequests()
    const repository = repositories?.find((repo) => repo.pull_requests.includes(pullRequest))

    const {
        title,
        status,
        deeplink,
        branch,
        number,
        last_updated_at,
        author,
        base_branch,
        body,
        num_comments,
        comments,
        additions,
        deletions,
    } = pullRequest
    const formattedTimeSince = getHumanTimeSinceDateTime(DateTime.fromISO(last_updated_at))
    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <Icon icon={logos.github} color="black" />
                <Label color="light">{repository?.name}</Label>
                <MarginLeftAuto>
                    <ExternalLinkButton link={deeplink} />
                </MarginLeftAuto>
            </DetailsTopContainer>
            <TitleContainer>{title}</TitleContainer>
            <InfoContainer>
                <Status type={status.color}>{status.text}</Status>
                <Gap4>
                    <LinesModified color="green">{`+${additions}`}</LinesModified>
                    <LinesModified color="red">{`-${deletions}`}</LinesModified>
                </Gap4>
            </InfoContainer>
            <Label color="light">{`#${number} updated ${formattedTimeSince} by ${author}`}</Label>
            <BranchInfoContainer>
                <BranchName name={branch} />
                <Icon icon={icons.arrow_right} />
                <BranchName name={base_branch} />
            </BranchInfoContainer>
            <Divider color={Colors.border.extra_light} />
            <Eyebrow color="light">Description</Eyebrow>
            <PullRequestComment author={author} body={body} lastUpdatedAt={last_updated_at} isAuthorOfPR />
            {num_comments > 0 && (
                <>
                    <Divider color={Colors.border.extra_light} />
                    <Eyebrow color="light">{`Comments (${num_comments})`}</Eyebrow>
                    {comments
                        .sort((a, b) => +DateTime.fromISO(a.last_updated_at) - +DateTime.fromISO(b.last_updated_at))
                        .map((c) => (
                            <PullRequestComment
                                key={c.last_updated_at}
                                author={c.author}
                                body={c.body}
                                lastUpdatedAt={c.last_updated_at}
                                isAuthorOfPR={c.author === author}
                            />
                        ))}
                </>
            )}
        </DetailsViewTemplate>
    )
}

export default PullRequestDetails
