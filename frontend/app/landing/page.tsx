import { redirect } from 'next/navigation'

/**
 * /landing redirects to the home page.
 * This route exists to prevent 404s from any old links.
 */
export default function LandingRedirect() {
  redirect('/')
}
