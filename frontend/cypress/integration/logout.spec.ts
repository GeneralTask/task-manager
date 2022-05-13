describe('user successfuly logs out after being authenticated', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    it('clicking "Sign Out" button removes authToken cookie and redirects user to unauthorized landing page', () => {
        cy.findByText('Sign Out').click()
        cy.url().should('equal', `${Cypress.config().baseUrl}/`)
        cy.wait(1000)
        cy.getCookie('authToken').should('not.exist')
        cy.getCookies().then(cookies => {
            cy.log(JSON.stringify(cookies))
        })
    })
})
