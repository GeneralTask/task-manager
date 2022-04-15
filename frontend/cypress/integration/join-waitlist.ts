import chance from "chance"
const Chance = new chance()

describe('join waitlist tests', () => {
    beforeEach('visit unauthorized landing page', () => {
        cy.visit('/')
    })

    it('submit valid non-duplicate email in join waitlist form', () => {
        // Randomly generate a valid email address
        const email = Chance.email()

        // Enter email and click Join the Waitlist button
        cy.get('input').type(email)
        cy.get('button').contains('Join the Waitlist').click()

        // Check if 'success' field shows
        cy.findByTestId('response-container').should('be.visible')
        cy.findByTestId('response-container').invoke('text').then((text) => {
            expect(text).to.equal('Success!')
        })
    })

    it('submit empty string in join waitlist form', () => {
        // Click Join the Waitlist button without entering email
        cy.get('button').contains('Join the Waitlist').click()

        // Check if 'Email field is required' field shows
        cy.findByTestId('response-container').should('be.visible')
        cy.findByTestId('response-container').invoke('text').then((text) => {
            expect(text).to.equal('Email field is required')
        })
    })

    it('submit invalid non-duplicate email in join waitlist form', () => {
        // Intercept waitlist requests
        cy.intercept('POST', '/waitlist/').as('waitlistPostFail')

        // Enter invalid email and click Join the Waitlist button
        cy.get('input').type('join_waitlist_test_fail')
        cy.get('button').contains('Join the Waitlist').click()

        // Wait for request to complete
        cy.wait('@waitlistPostFail')

        // Check if error field shows
        cy.findByTestId('response-container').should('be.visible')
        cy.findByTestId('response-container').invoke('text').then((text) => {
            expect(text).to.equal('There was an error adding you to the waitlist')
        })
    })


    it('submit valid duplicate email in join waitlist form', () => {
        // Intercept waitlist requests
        const email = Chance.email()

        // Intercept waitlist request
        cy.intercept('POST', '/waitlist/').as('waitlistPost')

        // Enter valid email and click Join the Waitlist button
        cy.get('input').type(email)
        cy.get('button').contains('Join the Waitlist').click()

        // Wait for request to complete
        cy.wait('@waitlistPost')

        // Enter valid duplicate email and click Join the Waitlist button
        cy.get('input').clear().type(email)
        cy.get('button').contains('Join the Waitlist').click()

        // Wait for request to complete
        cy.wait('@waitlistPost')

        // Check if error field shows
        cy.findByTestId('response-container').should('be.visible')
        cy.findByTestId('response-container').invoke('text').should((text) => {
            expect(text).to.equal('There was an error adding you to the waitlist')
        })
    })
})
