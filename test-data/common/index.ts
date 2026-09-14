// index.ts
import { faker } from '@faker-js/faker'

export const baseUrl = {
  dev: '',
  stg: '',
  portal: '',
  feature: '',
  amplify: '',
}

// uncomment accounts to enable/disable dealer-admin, dealer and so on
export const users = [
  { email: '', password: '', role: 'admin' },
  { email: '', password: '', role: 'dealer-admin' },
  { email: '', password: '', role: 'dealer' },
]

function appendTimestamp(name: string): string {
  const now = new Date()

  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  const timestamp = `${day}${month}${hours}${minutes}`

  return `${name}_${timestamp}`
}

export function currentDate(): string {
  const now = new Date()

  const month = now.getMonth() + 1 // Months are 0-indexed
  const day = now.getDate()
  const year = now.getFullYear()

  return `${month}/${day}/${year}`
}

export const testData = {
  name: '',
  dealerId: '',
  screenName: '',
  playlistName: '',
  newScreenName: appendTimestamp(''),
  newScreenDesc: appendTimestamp(''),
  newPlaylistName: appendTimestamp(''),
  newPlaylistDesc: appendTimestamp(''),
}

export const dealerFormData = {
  businessName: '',
  dealerId: '',
  dealerAlias: '',
  ownerFirstName: faker.person.firstName(),
  ownerLastname: faker.person.lastName(),
  email: faker.internet.email(),
  password: '',
  contactNumber: faker.string.numeric(10),
  contactPerson: faker.person.fullName(),
  city: '',
  state: '',
  region: '',
  playerCount: '',
  startDate: currentDate(),
}
