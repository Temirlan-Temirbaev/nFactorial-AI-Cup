'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StudentRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useMyClasses } from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Users, TrendingUp, FileText, GraduationCap } from 'lucide-react';
import type { ClassDetails } from '@/lib/api/classes';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { data: myClassData, isLoading, error } = useMyClasses();
  
  // For students, useMyClasses returns a single ClassDetails object
  const classDetails = myClassData as ClassDetails;

  if (isLoading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your class...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (error || !classDetails) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load class details or you are not enrolled in any class.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{classDetails.name}</h1>
                  <p className="text-sm text-gray-600">
                    Class Code: <span className="font-mono font-bold text-blue-600">{classDetails.code}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </span>
                <Button onClick={logout} size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            {/* Class Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Classmates</p>
                      <p className="text-2xl font-bold">{classDetails.students.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Book className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Books</p>
                      <p className="text-2xl font-bold">{classDetails.books.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Chapters</p>
                      <p className="text-2xl font-bold">
                        {classDetails.books.reduce((total: number, book) => total + book.chaptersCount, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Your Progress</p>
                      <p className="text-2xl font-bold ">0%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Teacher Info */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {classDetails.teacher.firstName?.[0] || classDetails.teacher.email[0].toUpperCase()}
                      </span>
                    </div>
                    Your Teacher
                  </CardTitle>
                  <CardDescription>
                    {classDetails.teacher.firstName && classDetails.teacher.lastName 
                      ? `${classDetails.teacher.firstName} ${classDetails.teacher.lastName}`
                      : classDetails.teacher.email
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{classDetails.teacher.email}</p>
                  {classDetails.description && (
                    <p className="text-sm text-gray-700 mt-2">{classDetails.description}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Books Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Books & Materials</h2>
                  <p className="text-gray-600">Reading materials for this class</p>
                </div>
              </div>

              {classDetails.books.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No books available yet</h3>
                    <p className="text-gray-600">Your teacher hasn't uploaded any books yet. Check back later!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classDetails.books.map((book) => (
                    <Link key={book.id} href={`/student/book/${book.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-start gap-3">
                            <Book className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                            <span className="line-clamp-2">{book.title}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Chapters:</span>
                              <span className="font-medium">{book.chaptersCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Added:</span>
                              <span className="font-medium">
                                {new Date(book.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button className="w-full mt-4" variant="outline">
                            Start Reading
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Classmates Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Classmates</h2>
                  <p className="text-gray-600">
                    {classDetails.students.length} student{classDetails.students.length !== 1 ? 's' : ''} in this class
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Class Members</CardTitle>
                  <CardDescription>
                    Students enrolled in {classDetails.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classDetails.students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {student.firstName?.[0] || student.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {student.firstName && student.lastName 
                                ? `${student.firstName} ${student.lastName}`
                                : student.email
                              }
                              {student.id === user?.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Joined {new Date(student.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </StudentRoute>
  );
} 