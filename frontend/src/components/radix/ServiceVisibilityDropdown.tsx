import { useState } from 'react'
import { useSetting } from '../../hooks'
import { icons } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTDropdownMenu from './GTDropdownMenu'

interface ServiceVisibilityDropdownProps {
    disabled?: boolean
}
const ServiceVisibilityDropdown = ({ disabled }: ServiceVisibilityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const showGitHubSetting = useSetting('sidebar_github_preference')
    const showLinearSetting = useSetting('sidebar_linear_preference')
    const showSlackSetting = useSetting('sidebar_slack_preference')

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            items={[
                {
                    label: 'GitHub PRs',
                    onClick: () =>
                        showGitHubSetting.updateSetting(showGitHubSetting.field_value === 'true' ? 'false' : 'true'),
                    selected: showGitHubSetting.field_value === 'true',
                },
                {
                    label: 'Linear',
                    onClick: () =>
                        showLinearSetting.updateSetting(showLinearSetting.field_value === 'true' ? 'false' : 'true'),
                    selected: showLinearSetting.field_value === 'true',
                },
                {
                    label: 'Slack',
                    onClick: () =>
                        showSlackSetting.updateSetting(showSlackSetting.field_value === 'true' ? 'false' : 'true'),
                    selected: showSlackSetting.field_value === 'true',
                },
            ]}
            keepOpenOnSelect
            trigger={<GTIconButton icon={icons.pencil} onClick={() => setIsOpen(!isOpen)} disabled={disabled} asDiv />}
        />
    )
}

export default ServiceVisibilityDropdown
