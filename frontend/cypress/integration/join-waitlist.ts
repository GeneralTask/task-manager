describe('joint waitlist from landing page', () => {
    it('visit unauthorized landing page', () => {

        cy.visit('/')
    })
    it('submit valid non-duplicate email in join waitlist form', () => {

        const url = "/waitlist/"
        cy.intercept('POST', url, { statusCode: 201 }).as('waitlist')

        cy.get('input').type('join_waitlist_test@generaltask.com')
        cy.get('button').contains('Join the Waitlist').click()
        cy.wait('@waitlist')
        cy.findByTestId('response-container').should('be.visible')
        cy.findByTestId('response-container').invoke('text').then((text) => {
            expect(text).to.equal('Success!')
        })
    })
})

export { }
