import { useState } from 'react'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
import Tip from '../radix/Tip'
import SettingsModal from './SettingsModal'

interface SettingsModalSettingsModalButtonProps {
    isCollapsed?: boolean
}
const SettingsModalButton = ({ isCollapsed = false }: SettingsModalSettingsModalButtonProps) => {
    const [modalIsOpen, setModalIsOpen] = useState(false)

    return (
        <>
            {isCollapsed ? (
                <Tip content="Settings" side="right">
                    <CollapsedIconContainer onClick={() => setModalIsOpen(true)}>
                        <Icon icon={icons.gear} />
                    </CollapsedIconContainer>
                </Tip>
            ) : (
                <GTButton
                    value="Settings"
                    styleType="secondary"
                    size="small"
                    fitContent={false}
                    onClick={() => setModalIsOpen(true)}
                />
            )}
            <SettingsModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
        </>
    )
}

export default SettingsModalButton
