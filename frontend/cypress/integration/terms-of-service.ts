const REDIRECT_TIMEOUT = 6000;

describe('new user is redirected to terms of service page', () => {
    beforeEach('login the user', () => {
        cy.login()
        cy.visit('/')
    })
    it('user redirects to terms of service page', () => {
        cy.location('pathname', { timeout: REDIRECT_TIMEOUT }).should('include', '/tos-summary')
    })
    it('clicking submit button without accepting TOS does not redirect to landing page', () => {
        cy.findByTestId('terms-submit-button').should('be.disabled')
    })
    it('clicking submit button and accepting TOS redirects to landing page', () => {
        cy.acceptTermsOfService()
        cy.location('pathname', { timeout: REDIRECT_TIMEOUT }).should('include', '/tasks')
    })
})
