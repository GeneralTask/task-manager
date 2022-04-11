
describe('joint waitlist from landing page', () => {
    beforeEach(() => {
        cy.visit('localhost:3000/')
    })
    it('enter email in email input field', () => {
        cy.get('input').type('test@generaltask.com')
        cy.get('button').contains('Join the Waitlist').click()

    })
})
