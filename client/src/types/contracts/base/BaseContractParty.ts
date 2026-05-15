/**
 * Foundation type for every contract party (counterparty).
 */
export interface BaseContractParty {
  id: string
  organizationId: string
  legalName: string
  tradingName: string | null
  abn: string | null
  acn: string | null
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string | null
  address: PartyAddress
  created_at: Date
  updated_at: Date
}

export interface PartyAddress {
  street: string
  suburb: string
  state: string
  postcode: string
  country: string
}
