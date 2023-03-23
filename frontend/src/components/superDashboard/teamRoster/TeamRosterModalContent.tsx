import styled from 'styled-components'
import { useDeleteDashboardTeamMember, useGetDashboardTeamMembers } from '../../../services/api/super-dashboard.hooks'
import { Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import { Divider } from '../../atoms/SectionDivider'
import Spinner from '../../atoms/Spinner'
import GTButton from '../../atoms/buttons/GTButton'
import { BodyMedium, LabelSmall } from '../../atoms/typography/Typography'
import AddTeamMemberForm from './AddTeamMemberForm'

const TeamMemberList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
    max-height: 50vh;
    overflow-y: auto;
`

const TeamRosterModalContent = () => {
    const { data: teamMembers, isLoading } = useGetDashboardTeamMembers()
    const { mutate: deleteDashboardTeamMember } = useDeleteDashboardTeamMember()

    if (isLoading) {
        return <Spinner />
    }
    return (
        <Flex column gap={Spacing._16}>
            <TeamMemberList>
                {!teamMembers || teamMembers.length === 0 ? (
                    <BodyMedium color="muted">No team members</BodyMedium>
                ) : (
                    teamMembers.map((teamMember) => (
                        <Flex key={teamMember.id} justifyContent="space-between" alignItems="center">
                            <Flex alignItems="center" gap={Spacing._24}>
                                <Icon icon={icons.user} />
                                <Flex column>
                                    <BodyMedium>{teamMember.name}</BodyMedium>
                                    {teamMember.email && <LabelSmall>{teamMember.email}</LabelSmall>}
                                    {teamMember.github_id && <LabelSmall>{teamMember.github_id}</LabelSmall>}
                                </Flex>
                            </Flex>
                            <GTButton
                                styleType="icon"
                                icon={icons.trash}
                                iconColor="red"
                                tooltipText="Remove team member"
                                onClick={() =>
                                    deleteDashboardTeamMember({ id: teamMember.id }, teamMember.optimisticId)
                                }
                            />
                        </Flex>
                    ))
                )}
            </TeamMemberList>
            <Divider />
            <AddTeamMemberForm />
        </Flex>
    )
}

export default TeamRosterModalContent
