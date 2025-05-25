'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Join Our Learning Platform
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Choose how you'd like to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Teacher Registration Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <CardTitle className="text-xl">I'm a Teacher</CardTitle>
                <CardDescription>
                  Create and manage classes, upload materials, and track student progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900">What you can do:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Create unlimited classes</li>
                    <li>• Upload books and materials</li>
                    <li>• Generate AI-powered quizzes</li>
                    <li>• Track student engagement</li>
                    <li>• Create learning summaries</li>
                  </ul>
                </div>
                <Link href="/register/teacher" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Register as Teacher
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Student Registration Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">I'm a Student</CardTitle>
                <CardDescription>
                  Join your teacher's class with a class code and start learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900">What you'll get:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Access to class materials</li>
                    <li>• Interactive AI-generated content</li>
                    <li>• Take quizzes and tests</li>
                    <li>• Track your learning progress</li>
                    <li>• Collaborate with classmates</li>
                  </ul>
                </div>
                <Link href="/register/student" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Join a Class
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Already have an account?</span>
              </div>
            </div>
            
            <Link href="/login">
              <Button variant="outline" className="w-full max-w-xs">
                Sign in to existing account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 