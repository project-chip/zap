/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing vuetour workflow', () => {
  it('open the preferences page and enable development tools', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.get('[data-test="preferences"]').click()
    cy.get('[data-test="toggle-development-tools"]').click()
    cy.get('[data-test="go-back-button"]').click()
  })
  it(
    'start the tutorial and check step 1',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="tutorial"]').click()

      cy.get('.v-step__header > div').then(($div) => {
        const title = $div.text()
        expect(title).to.eq('Adding Endpoints')
      })
      cy.get('.v-step__button-next').click()
    }
  )

  it('step 2', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.get('.v-step__content > div').then(($div2) => {
      const content = $div2.text()
      expect(content).to.eq(
        'To change the number of the endpoint on which you would like this device to appear, change the Endpoint setting.'
      )
    })
    cy.get('.v-step__button-next').click()
  })
  it('step 3', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.get('.v-step__content > div').then(($div2) => {
      const content = $div2.text()
      expect(content).to.eq(
        'From here you can select whether you would like the endpoint to represent something like a Light or a Door Lock. You can find the Zigbee device type by entering the name of the device in the Device field.'
      )
    })
    cy.get('.v-step__button-next').click()
  })
  it('step 4', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.get('.v-step__content > div').then(($div2) => {
      const content = $div2.text()
      expect(content).to.eq(
        'An endpoint can be assigned a network id that corresponds to which network it is on.'
      )
    })
    cy.get('.v-step__button-next').click()
  })
  it('step 5', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.get('.v-step__content > div').then(($div2) => {
      const content = $div2.text()
      expect(content).to.eq(
        'Once you have configured the endpoint, click CREATE to add the endpoint to your configuration.'
      )
    })
    cy.get('.v-step__button-next').click()
  })
    it(
      'step 6',
      { retries: { runMode: 2, openMode: 2 } },
      () => {
        cy.get('.v-step__header > div').then(($div) => {
          const title = $div.text()
          expect(title).to.eq('Modifying an Endpoint')
        })
        cy.get('.v-step__button-next').click()
      }
    )
    it('step 7', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'The clusters of the highlighted endpoint can be modified on the right side of the Zigbee Cluster Configurator.'
          )
        })
        cy.get('.v-step__button-next').click()
      })
      it('step 8', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'The Show dropdown shows all the available clusters for a certain endpoint. Selecting the Enabled Clusters option will display only clusters enabled on the endpoint.'
          )
        })
        cy.get('.v-step__button-next').click()
      })
      it(
        'step 9',
        { retries: { runMode: 2, openMode: 2 } },
        () => {
          cy.get('.v-step__header > div').then(($div) => {
            const title = $div.text()
            expect(title).to.eq('Configuring a Cluster')
          })
          cy.get('.v-step__button-next').click()
        }
      )
      it('step 10', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'Each cluster can be configured to implement Zigbee cluster attributes and commands. The Enable Command Discovery toggle in the top interface ribbon allows the list of commands supported by the device to be visible.'
          )
        })
        cy.get('.v-step__button-next').click()
      })
      it(
        'step 11',
        { retries: { runMode: 2, openMode: 2 } },
        () => {
          cy.get('.v-step__header > div').then(($div) => {
            const title = $div.text()
            expect(title).to.eq('Configuring Attributes')
          })
          cy.get('.v-step__button-next').click()
        }
      )
      it(
        'step 12',
        { retries: { runMode: 2, openMode: 2 } },
        () => {
          cy.get('.v-step__header > div').then(($div) => {
            const title = $div.text()
            expect(title).to.eq('Configuring Attribute Reporting')
          })
          cy.get('.v-step__button-next').click()
        }
      )
      it(
        'step 13',
        { retries: { runMode: 2, openMode: 2 } },
        () => {
          cy.get('.v-step__header > div').then(($div) => {
            const title = $div.text()
            expect(title).to.eq('Commands')
          })
          cy.get('.v-step__button-next').click()
        }
      )
      it('step 14', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'To enable or disable an attribute, click on the On/Off toggle. The attribute is ON when the toggle is shaded blue and to the right, and OFF when the toggle is shaded gray and to the left.'
          )
        })
        cy.get('.v-step__button-next').click()
      })
      it('step 15', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'Default attribute reporting is also controlled through the toggle. If the toggle is on, the attribute is set up to be reported by default.'
          )
        })
        cy.get('.v-step__button-next').click()
      })
      it('step 16', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'For instance, in the following example, Endpoint 1 only implements the Server side of the On/Off cluster. Therefore, it is only possible for the cluster to receive the Off command ‘In’, which is in fact enabled for that cluster. With this setting enabled, the Zigbee Cluster Configurator automatically generates command handling code for handling the On/Off cluster’s ‘Off’ command. This will ensure that, when an ‘Off’ command is received, it will be routed to the correct command handling callback.'
          )
        })
        cy.get('.v-step__button-next').click()
      })
      it('step 17', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'In Zigbee, the Zigbee Cluster Library (ZCL) allows developers to add their own custom clusters to their applications. The custom ZCL must be described in the Silicon Labs ZCL XML format. For examples of custom ZCL XML, see the file sampleextensions.xml in the /app/zcl directory. This XML file can be used as a reference for your custom ZCL XML file. Once you have created your custom ZCL XML file, it can be added to your project through the ZCL EXTENSIONS… interface.'
          )
        })
        cy.get('.v-step__button-next').click()
      })
      it('step 18', { retries: { runMode: 2, openMode: 2 } }, () => {
        cy.get('.v-step__content > div').then(($div2) => {
          const content = $div2.text()
          expect(content).to.eq(
            'Clicking ZCL EXTENSIONS… opens the Custom ZCL page in the Zigbee Cluster Configurator. Click Add to add your custom ZCL XML to the project. Browse to the location of the custom ZCL XML, select a file, and click Open. Once the custom ZCL XML has been read into the Zigbee Cluster Configurator, your custom clusters, attributes, commands, and so on are accessible to the configuration of your application.'
          )
        })
        cy.get('.v-step__button-stop').click()
      })
})
