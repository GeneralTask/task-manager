import styled from 'styled-components'
import { useSetting } from '../../../hooks'
import { useGetLeaderboardRepositories } from '../../../services/api/leaderboard.hooks'
import { Border, Colors, Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'
import { BodyMedium } from '../../atoms/typography/Typography'
import GTModal from '../../mantine/GTModal'

const RepositoryList = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    overflow-y: auto;
    margin-bottom: ${Spacing._24};
`
const Repository = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._12} ${Spacing._8};
    border-radius: ${Border.radius.small};
    :hover {
        cursor: pointer;
        background-color: ${Colors.background.hover};
    }
`

interface RepositorySelectionModalProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
}

const RepositorySelectionModal = ({ isOpen, setIsOpen }: RepositorySelectionModalProps) => {
    const { data: repositories } = useGetLeaderboardRepositories()
    const { field_value: selectedRepositoryId, updateSetting: updateSelectedRepositoryId } = useSetting(
        'leaderboard_github_repository_id'
    )

    return (
        <GTModal
            open={isOpen}
            setIsModalOpen={setIsOpen}
            tabs={{
                title: 'Select a Repository',
                subtitle: 'Choose which Repository to feature on the leaderboard',
                body: (
                    <>
                        <RepositoryList>
                            {repositories?.map((repository) => (
                                <Repository
                                    key={repository.id}
                                    onClick={() => updateSelectedRepositoryId(repository.id)}
                                >
                                    <Flex alignItems="center" gap={Spacing._8}>
                                        <Icon icon={repository.image_url} />
                                        <BodyMedium>{repository.name}</BodyMedium>
                                    </Flex>
                                    {(selectedRepositoryId || '2') === repository.id && <Icon icon={icons.check} />}
                                </Repository>
                            ))}
                        </RepositoryList>
                        <Flex alignItems="center" gap={Spacing._16}>
                            <GTButton styleType="primary" value="Continue" onClick={() => setIsOpen(false)} />
                            <GTButton styleType="secondary" value="Cancel" onClick={() => setIsOpen(false)} />
                        </Flex>
                    </>
                ),
            }}
        />
    )
}

export default RepositorySelectionModal
