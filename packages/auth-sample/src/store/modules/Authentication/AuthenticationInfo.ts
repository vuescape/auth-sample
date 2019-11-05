export interface AuthenticationInfo {
  access_token?: string
  token_type?: string
  expires_in?: number

  issued_at?: number

  // Computed based on the expires_in
  readonly expires_at?: number
}
