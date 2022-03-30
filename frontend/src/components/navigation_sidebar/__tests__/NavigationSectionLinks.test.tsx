import React from 'react'
import { View } from 'react-native'
import renderer from 'react-test-renderer'
import { TTaskSection } from '../../../utils/types'
import NavigationSectionLinks from '../NavigationSectionLinks'

const mockNavigationLink = <View></View>
jest.mock('../NavigationLink', () => {
    return {
        __esModule: true,
        default: () => mockNavigationLink,
    }
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
        <NavigationSectionLinks taskSections={noTaskSections} sectionId={''} pathName={''} />
    ).toJSON()
    expect(tree).toMatchSnapshot()
})


test('NavigationSectionLinks renders three components when there is 1 task section', () => {
    const tree = renderer.create(
        <NavigationSectionLinks taskSections={singleTaskSection} sectionId={''} pathName={''} />
    ).toJSON()
    expect(tree).toMatchSnapshot()
})
