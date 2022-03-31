/**
 * @jest-environment jsdom
 */

import React from 'react'
import renderer from 'react-test-renderer'
import { TTaskSection } from '../../../utils/types'
import NavigationSectionLinks from '../NavigationSectionLinks'
import { QueryClient, QueryClientProvider } from 'react-query'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { BrowserRouter } from 'react-router-dom'


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
})

const noTaskSections: TTaskSection[] = []
const singleTaskSection: TTaskSection[] = [{
    id: '1',
    name: 'Section 1',
    tasks: [],
    is_done: false,
}]

test('NavigationSectionLinks renders three components when there are 0 task sections', () => {
    const tree = renderer.create(
        <QueryClientProvider client={queryClient}>
            <DndProvider backend={HTML5Backend}>
                <BrowserRouter>
                    <NavigationSectionLinks taskSections={noTaskSections} sectionId={''} pathName={''} />
                </BrowserRouter>
            </DndProvider>
        </QueryClientProvider>
    ).toJSON()
    expect(tree).toMatchSnapshot()
})


test('NavigationSectionLinks renders three components when there is 1 task section', () => {
    const tree = renderer.create(
        <QueryClientProvider client={queryClient}>
            <DndProvider backend={HTML5Backend}>
                <BrowserRouter>
                    <NavigationSectionLinks taskSections={singleTaskSection} sectionId={''} pathName={''} />
                </BrowserRouter>
            </DndProvider>
        </QueryClientProvider>
    ).toJSON()
    expect(tree).toMatchSnapshot()
})
