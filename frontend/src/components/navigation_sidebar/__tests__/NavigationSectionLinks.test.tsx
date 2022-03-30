import React from 'react'
import renderer from 'react-test-renderer'
import { TTaskSection } from '../../../utils/types'
import NavigationSectionLinks from '../NavigationSectionLinks'


const noTaskSections = []

const singleTaskSection: TTaskSection[] = [{
    id: '1',
    name: 'Section 1',
    tasks: [],
    is_done: false,
}]


test('Single task section renders properly', () => {
    const component = renderer.create(
        <NavigationSectionLinks taskSections={singleTaskSection} sectionId={''} pathName={''} />
    )
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
})
