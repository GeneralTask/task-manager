import { useToast } from '../../hooks'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { BranchNameContainer, BranchNameText } from './styles'

interface BranchNameProps {
    name: string
}
const BranchName = ({ name }: BranchNameProps) => {
    const toast = useToast()
    const handleClick = () => {
        navigator.clipboard.writeText(name)
        toast.show(
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
    return (
        <TooltipWrapper dataTip={name} tooltipId="tooltip" inline>
            <BranchNameContainer onClick={handleClick}>
                <BranchNameText>{name}</BranchNameText>
                <Icon icon={icons.copy} color="purple" />
            </BranchNameContainer>
        </TooltipWrapper>
    )
}

export default BranchName
