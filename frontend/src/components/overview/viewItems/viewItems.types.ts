import React from 'react'
import { TOverviewView } from '../../../utils/types'

export interface ViewItemsProps {
    view: TOverviewView
    visibleItemsCount: number
    scrollRef?: React.RefObject<HTMLDivElement>
}
