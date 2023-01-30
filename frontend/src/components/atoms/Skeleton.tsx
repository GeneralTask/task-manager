import ReactLoadingSkeleton from 'react-loading-skeleton'
import styled from 'styled-components'
import { Spacing } from '../../styles'

const SkeletonWrapper = styled.div`
    margin-bottom: ${Spacing._4};
`

const SKELETON_HEIGHT = 35
const DEFAULT_SKELETON_COUNT = 3

interface SkeletonProps {
    count?: number
}
const Skeleton = ({ count = DEFAULT_SKELETON_COUNT }: SkeletonProps) => {
    return <ReactLoadingSkeleton height={SKELETON_HEIGHT} count={count} wrapper={SkeletonWrapper} />
}

export default Skeleton
