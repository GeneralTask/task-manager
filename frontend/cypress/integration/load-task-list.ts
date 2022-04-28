const REDIRECT_TIMEOUT = 6000;
import chance from 'chance'
const Chance = new chance()
const API_URL = Cypress.env('api_url')

describe('new user loads 3 initial tasks', () => {
    beforeEach('load landing page', () => {
        cy.request('POST', `${API_URL}/create_test_user/`, {
            email: `${Chance.string()}@generaltask.com`,
            name: 'Test User',
        }).then((response) => {
            cy.setCookie('authToken', `${response.body.token}`)
        })
        cy.visit('/')
        cy.findByTestId('terms-check-button').click()
        cy.findByTestId('terms-submit-button').click()
        cy.location('pathname', { timeout: REDIRECT_TIMEOUT }).should('include', '/tasks')
    })
    it('loads 3 initial tasks', () => {
        cy.findByTestId('task-list-container').should('be.visible')
        cy.findAllByTestId('list-item').should('have.length', 3)
    })
    it('loads 0 tasks in done section', () => {
        cy.visit('/tasks/000000000000000000000004')
        cy.findByTestId('task-list-container').should('be.empty')
    })
})
