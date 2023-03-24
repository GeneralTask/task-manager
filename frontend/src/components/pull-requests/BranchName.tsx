import { usePreviewMode, useToast } from '../../hooks'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { toast } from '../molecules/toast/utils'
import Tip from '../radix/Tip'
import { BranchNameContainer, BranchNameText } from './styles'

interface BranchNameProps {
    name: string
}
const BranchName = ({ name }: BranchNameProps) => {
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()
    const handleClick = () => {
        navigator.clipboard.writeText(name)
        if (isPreviewMode) {
            toast('Branch copied to clipboard')
        } else {
            oldToast.show(
                {
                    message: 'Branch copied to clipboard',
                },
                {
                    autoClose: 2000,
                    pauseOnFocusLoss: false,
                    theme: 'dark',
                }
            )
        }
    }
    return (
        <Tip content={name}>
            <BranchNameContainer onClick={handleClick}>
                <BranchNameText>{name}</BranchNameText>
                <Icon icon={icons.copy} color="purple" />
            </BranchNameContainer>
        </Tip>
    )
}

export default BranchName
