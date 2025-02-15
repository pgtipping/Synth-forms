"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/nav-bar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main>
        {/* Hero Section */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Create Beautiful Forms in Minutes
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
                Choose from our extensive collection of professionally designed form templates,
                customize them to match your brand, and start collecting responses instantly.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/templates">
                  <Button size="lg" className="text-base">
                    Browse Templates
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="text-base">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 sm:py-32 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">
                Powerful Features
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Choose Our Form Templates?
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Everything you need to create professional forms and collect responses efficiently.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
                <div className="flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
                  <h3 className="text-xl font-semibold leading-7 text-gray-900">
                    Professional Design
                  </h3>
                  <p className="mt-4 text-base leading-7 text-gray-600">
                    Our templates are crafted by professional designers to ensure a
                    polished and modern look.
                  </p>
                </div>
                <div className="flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
                  <h3 className="text-xl font-semibold leading-7 text-gray-900">
                    Easy Customization
                  </h3>
                  <p className="mt-4 text-base leading-7 text-gray-600">
                    Customize colors, fonts, and layouts to match your brand identity
                    with our intuitive editor.
                  </p>
                </div>
                <div className="flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
                  <h3 className="text-xl font-semibold leading-7 text-gray-900">
                    Smart Analytics
                  </h3>
                  <p className="mt-4 text-base leading-7 text-gray-600">
                    Track form submissions, analyze responses, and export data with
                    our built-in analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-900 py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to Create Your First Form?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                Get started with our extensive collection of templates and create
                your first form in minutes.
              </p>
              <div className="mt-10 flex items-center justify-center">
                <Link href="/templates">
                  <Button size="lg" variant="secondary" className="text-base">
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}