import { useState } from 'react'
import { TOverviewSuggestion } from '../../../services/api/overview.hooks'
import { Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'

interface SmartSuggestionProps {
    suggestion: TOverviewSuggestion
    onRevertToManual: () => void
}
const SmartSuggestion = ({ suggestion, onRevertToManual }: SmartSuggestionProps) => {
    const [isSaved, setIsSaved] = useState(false)

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
        </div>
    )
}

export default SmartSuggestion
