describe('user can edit a task title', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    it('select a task', () => {
        // Intercept task modify request
        cy.intercept('PATCH', '/tasks/modify/*').as('modifyTaskTitleMutation')

        // select one task
        cy.findAllByTestId('list-item').first().click()

        // make sure detail view has opened
        cy.findByTestId('details-view-container').should('be.visible')

        // edit the task title
        cy.findByTestId('task-title-input').clear().type('new task title')

        // wait for task title modify request to finish
        cy.wait('@modifyTaskTitleMutation')

        // reload page and verify that the task title has been updated
        cy.reload()
        cy.findByTestId('task-title-input').should('have.value', 'new task title')

        // also verify that the task title has been updated in the task list
        cy.findAllByTestId('list-item').first().should('have.text', 'new task title')
    })
})
