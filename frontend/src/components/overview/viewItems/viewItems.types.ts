import React from 'react'
import { TOverviewView } from '../../../utils/types'

export interface ViewItemsProps {
    view: TOverviewView
    scrollRef?: React.RefObject<HTMLDivElement>
    hideHeader?: boolean
}
