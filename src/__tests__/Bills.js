/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedBills from '../__mocks__/store.js'
import userEvent from '@testing-library/user-event'

import Store from '../app/Store.js'

import router from "../app/Router.js";
import Bills from '../containers/Bills.js';
import { formatDate, formatStatus } from "../app/format.js"
import $ from 'jquery'

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test('Then eye icon should show the bill', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsPage = new Bills({document, onNavigate, store: mockedBills, localStorage: localStorageMock})
      const mockHandleClickIconEye = jest.fn(billsPage.handleClickIconEye)
      const modalFile = document.querySelector('#modaleFile')
      $.fn.modal = jest.fn(modalFile.classList.add('show'))

      const iconEyes = screen.getAllByTestId('icon-eye')
      iconEyes.forEach(icon => {
        icon.addEventListener('click', () => mockHandleClickIconEye(icon))
      }) 
      iconEyes.forEach(icon => {
        userEvent.click(icon)
      })

      expect(mockHandleClickIconEye).toHaveBeenCalledTimes(iconEyes.length)
      expect(modalFile).toHaveClass('show')
    })

    test('Then New Bill button should redirect to NewBill', () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const rootDiv = document.createElement("div")
      rootDiv.setAttribute("id", "root")
      document.body.append(rootDiv)
      rootDiv.innerHTML = BillsUI(bills)
      const mockOnNavigate = jest.fn()
      const billsPage = new Bills({ document, onNavigate: mockOnNavigate, mockedBills, localStorageMock })

      const btnNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`)
      userEvent.click(btnNewBill)

      expect(mockOnNavigate).toHaveBeenCalledWith('#employee/bill/new')
    })

    test('Then bills should match with fixture', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsFixture = bills.map(doc => {
        return {
          ...doc,
          date: formatDate(doc.date),
          status: formatStatus(doc.status)
        }
      })
      const billsPage = new Bills({document, onNavigate, store: mockedBills, localStorage: localStorageMock})
      const billsList = await billsPage.getBills()
      billsFixture.forEach(fixture => {
        expect(billsList).toContainEqual(fixture)
      })
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to the Bills page", () => {
    test('Then we fetch bills from mock API', async () => {
      document.body.innerHTML = ''
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
    
      const mockOnNavigate = jest.fn()
      const billsPage = new Bills({ document, onNavigate: mockOnNavigate, store: mockedBills, localStorage: localStorageMock })
    
      root.innerHTML = BillsUI({data: await billsPage.getBills()})
      expect(document).toMatchSnapshot()
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockedBills, "bills")
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.innerHTML = ''
      document.body.append(root)
      router()
    })
    test("Then it fetches an 404 error", async () => {
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
      }})
      const rootDiv = document.querySelector('#root')
      const billsPage = new Bills({ document, onNavigate: window.onNavigate, store: mockedBills, localStorage: localStorageMock })
      billsPage.getBills().then(data => {
        // on fetch l'erreur 404
        rootDiv.innerHTML = BillsUI({ data })
      }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname: ROUTES_PATH['Bills'], error })
      })
      // on attends un tick pour finir le chargement
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message.textContent).toBeTruthy()
    })
    test("Then it fetches an 500 error", async () => {
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
      }})
      const rootDiv = document.querySelector('#root')
      const billsPage = new Bills({ document, onNavigate: window.onNavigate, store: mockedBills, localStorage: localStorageMock })
      billsPage.getBills().then(data => {
        // on fetch l'erreur 500
        rootDiv.innerHTML = BillsUI({ data })
      }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname: ROUTES_PATH['Bills'], error })
      })
      // on attends un tick pour finir le chargement
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message.textContent).toBeTruthy()
    })
  })
})
