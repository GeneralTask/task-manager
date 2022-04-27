const REDIRECT_TIMEOUT = 6000;
import chance from "chance"
const Chance = new chance()

describe('new user is redirected to terms of service page', () => {
    beforeEach('make request for authorization token', () => {
        cy.request('POST', 'localhost:8080/create_test_user/', {
            email: `${Chance.string()}@generaltask.com`,
            name: 'Test User',
        }).then((response) => {
            cy.setCookie('authToken', `${response.body.token}`)
        })
    })
    beforeEach('visit generaltask', () => {
        cy.visit('/')
    })
    it('user redirects to terms of service page', () => {
        cy.location('pathname', { timeout: REDIRECT_TIMEOUT }).should('include', '/tos-summary')
    })
    it('clicking submit button without accepting TOS does not redirect to landing page', () => {
        cy.findByTestId('terms-submit-button').should('be.disabled')
    })
    it('clicking submit button and accepting TOS redirects to landing page', () => {
        cy.findByTestId('terms-check-button').click()
        cy.findByTestId('terms-submit-button').click()
        cy.location('pathname', { timeout: REDIRECT_TIMEOUT }).should('include', '/tasks')
    })
})
