import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function NavBar() {
  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            FormBuilder
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link 
              href="/templates" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Templates
            </Link>
            <Link 
              href="/my-forms" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              My Forms
            </Link>
            <Link 
              href="/integrations" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Integrations
            </Link>
            <Link 
              href="/products" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Products
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-sm font-medium">
              Login
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="text-sm font-medium">
              Sign Up for Free
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
