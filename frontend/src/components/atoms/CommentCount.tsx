import styled from 'styled-components'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from './Icon'

export const CommentsCountContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
`
interface CommentsCountProps {
    count: number
}
const CommentCount = ({ count }: CommentsCountProps) => (
    <CommentsCountContainer>
        <Icon icon={icons.comment} size="xSmall" />
        {count}
    </CommentsCountContainer>
)

export default CommentCount
