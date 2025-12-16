/**
 * CSRF Token Generation Endpoint
 * Provides CSRF tokens to clients for form submissions
 */

import { NextRequest } from 'next/server'
import { generateCSRFTokenForClient } from '@/lib/security/csrf'

export async function GET(request: NextRequest) {
  const { response } = generateCSRFTokenForClient(request)
  return response
}
