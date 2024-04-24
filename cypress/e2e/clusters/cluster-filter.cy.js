/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing cluster filters', () => {
  it('create a new endpoint', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1, data.cluster1)
    })
  })
  it(
    'filter enabled clusters and check clusters',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="filter-input"]').click()
      cy.get('.q-virtual-scroll__content > :nth-child(3)').click({
        force: true,
      })
      cy.fixture('data').then((data) => {
        cy.get('tbody').children().contains(data.cluster2).should('not.exist')
      })
    }
  )
  it(
    'enable power configuration cluster',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="filter-input"]').click({ force: true })
      cy.get('.q-virtual-scroll__content > :nth-child(1)').click()
      cy.fixture('data').then((data) => {
        cy.get('tbody').children().should('contain', data.cluster2)
      })
      cy.get('#General').click({ force: true })
      cy.get(
        '#General > .q-expansion-item__container > .q-expansion-item__content > .q-card > .q-card__section > .row >  .q-table__container > .q-table__middle > .q-table > tbody > :nth-child(2) > :nth-child(6) > .q-field > .q-field__inner > .q-field__control'
      ).click({ force: true })
      cy.fixture('data').then((data) => {
        cy.get('.q-virtual-scroll__content > :nth-child(3)')
          .contains(data.server1)
          .click()
      })
      cy.get(
        '.v-step-7 > .q-field > .q-field__inner > .q-field__control'
      ).click({ force: true })
    }
  )
  it(
    'checks if power configuration exists',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('.q-virtual-scroll__content > :nth-child(2)').click({
        force: true,
        multiple: true,
      })
      cy.fixture('data').then((data) => {
        cy.get('tbody').children().should('contain', data.cluster2)
      })
    }
  )
  it('Close all the clusters', () => {
    cy.dataCy('cluster-btn-closeall').click()
    cy.get('[data-test=Cluster').each(($row) => {
      cy.wrap($row).should('have.class', 'q-expansion-item--collapsed')
    })
  })
})
