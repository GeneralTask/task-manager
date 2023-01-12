import { Fragment, useState } from 'react'
import { TOverviewSuggestion } from '../../../services/api/overview.hooks'
import { Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import { Divider } from '../../atoms/SectionDivider'
import TaskTemplate from '../../atoms/TaskTemplate'
import GTButton from '../../atoms/buttons/GTButton'
import { Mini } from '../../atoms/typography/Typography'
import useOverviewLists from '../useOverviewLists'

interface SmartSuggestionProps {
    suggestions: TOverviewSuggestion[]
    onRevertToManual: () => void
}
const SmartSuggestion = ({ suggestions, onRevertToManual }: SmartSuggestionProps) => {
    const [isSaved, setIsSaved] = useState(false)
    const { lists } = useOverviewLists()
    if (!lists) console.log(lists)
    const idToList = new Map(lists.map((list) => [list.id, list]))

    return (
        <div>
            <Flex justifyContent="space-between" alignItems="center">
                <GTButton
                    size="small"
                    value={
                        isSaved ? (
                            <Flex alignItems="center" gap={Spacing._8}>
                                <span>Saved</span>
                                <Icon icon={icons.check} color="white" />
                            </Flex>
                        ) : (
                            'Save'
                        )
                    }
                    onClick={() => setIsSaved(true)}
                    disabled={isSaved}
                />
                <GTButton
                    size="small"
                    value="Revert to manual sorting"
                    styleType="secondary"
                    onClick={onRevertToManual}
                />
            </Flex>
            {JSON.stringify(suggestions)}
            {suggestions.map((suggestion, index) => (
                <Fragment key={suggestion.id}>
                    <Flex justifyContent="space-between">
                        <TaskTemplate>{idToList.get(suggestion.id)?.name}</TaskTemplate>
                        <Mini color="light">{suggestion.reasoning}</Mini>
                    </Flex>
                    {index !== suggestions.length - 1 && <Divider />}
                </Fragment>
            ))}
        </div>
    )
}

export default SmartSuggestion
