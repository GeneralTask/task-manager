import { Colors } from '../../src/styles/'
import { hexToRGBString } from '../support/utils'

describe('selecting a task open the details view', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    it('clicking on a task should show its respective details view', () => {
        // iterate over the tasks and click on each one
        cy.findAllByTestId('list-item').each(($el) => {
            cy.wrap($el).click()
            cy.wrap($el).findByTestId('task-title').invoke('text').then((title) => {
                cy.findByTestId('details-view-container').get('textarea').should('have.value', title)
            })
        })
    })
    it('clicking on a task should highlight it in the list', () => {
        // iterate over the tasks and click on each one
        cy.findAllByTestId('list-item').each(($el) => {
            cy.wrap($el).click()
            cy.wrap($el).should('have.css', 'border-color', hexToRGBString(Colors.gray._500))
        })
    })
})
