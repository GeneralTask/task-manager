describe('user can edit a task body', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('select a task', () => {
        // Intercept task modify request
        cy.intercept('PATCH', '/tasks/modify/*').as('modifyTaskBodyMutation')

        // select one task
        cy.findAllByTestId('list-item').first().click()

        // make sure detail view has opened
        cy.findByTestId('details-view-container').should('be.visible')

        // edit the task body
        cy.findByTestId('task-body-input').clear().type('new task body')

        // wait for task body modify request to finish
        cy.wait('@modifyTaskBodyMutation')

        // reload page and verify that the task body has been updated
        cy.reload()
        cy.findByTestId('task-body-input').should('have.value', 'new task body')
    })
})
