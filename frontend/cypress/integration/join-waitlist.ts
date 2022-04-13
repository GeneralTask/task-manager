describe('join waitlist from landing page', () => {
    it('visit unauthorized landing page', () => {
        cy.visit('/')
    })
    it('submit valid non-duplicate email in join waitlist form', () => {
        // Intercept waitlist requests
        cy.intercept('POST', '/waitlist/', { statusCode: 201 }).as('waitlistPost')

        // Enter email and click Join the Waitlist button
        cy.get('input').type('join_waitlist_test@generaltask.com')
        cy.get('button').contains('Join the Waitlist').click()

        // Wait for request to complete
        cy.wait('@waitlistPost')

        // Check if 'success' field shows up
        cy.findByTestId('response-container').should('be.visible')
        cy.findByTestId('response-container').invoke('text').then((text) => {
            expect(text).to.equal('Success!')
        })
    })
})
