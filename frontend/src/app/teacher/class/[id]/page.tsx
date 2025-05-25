'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TeacherRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useClassDetails } from '@/hooks/useClasses';
import { useUploadBook } from '@/hooks/useBooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Upload, Book, Users, TrendingUp, FileText } from 'lucide-react';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const classId = params.id as string;
  
  const { data: classDetails, isLoading, error } = useClassDetails(classId);
  const uploadBookMutation = useUploadBook();
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFormData(prev => ({ ...prev, file }));
    }
  };

  const handleUploadBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFormData.file || !uploadFormData.title.trim()) {
      return;
    }

    try {
      await uploadBookMutation.mutateAsync({
        file: uploadFormData.file,
        data: {
          title: uploadFormData.title.trim(),
          classId,
        },
      });
      
      // Reset form and close modal
      setUploadFormData({ title: '', file: null });
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Failed to upload book:', error);
    }
  };

  if (isLoading) {
    return (
      <TeacherRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading class details...</p>
          </div>
        </div>
      </TeacherRoute>
    );
  }

  if (error || !classDetails) {
    return (
      <TeacherRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load class details.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{classDetails.name}</h1>
                  <p className="text-sm text-gray-600">
                    Class Code: <span className="font-mono font-bold text-blue-600">{classDetails.code}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Teacher: {user?.email}</span>
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
                      <p className="text-sm font-medium text-gray-600">Students</p>
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
                        {classDetails.books.reduce((total, book) => total + book.chaptersCount, 0)}
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
                      <p className="text-sm font-medium">Avg. Progress</p>
                      <p className="text-2xl font-bold">0%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Books Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Books & Materials</h2>
                  <p className="text-gray-600">Manage learning materials for this class</p>
                </div>
                
                <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Book
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload New Book</DialogTitle>
                      <DialogDescription>
                        Upload a book or document for your students to read.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUploadBook} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bookTitle">Book Title</Label>
                        <Input
                          id="bookTitle"
                          value={uploadFormData.title}
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Introduction to Mathematics"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bookFile">Book File</Label>
                        <Input
                          id="bookFile"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Supported formats: PDF, DOC, DOCX, TXT
                        </p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsUploadModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={uploadBookMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {uploadBookMutation.isPending ? 'Uploading...' : 'Upload Book'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {classDetails.books.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No books uploaded yet</h3>
                    <p className="text-gray-600 mb-4">Upload your first book to get started.</p>
                    <Button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your First Book
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classDetails.books.map((book) => (
                    <Link key={book.id} href={`/teacher/book/${book.id}`}>
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
                              <span className="text-gray-600">Uploaded:</span>
                              <span className="font-medium">
                                {new Date(book.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button className="w-full mt-4" variant="outline">
                            Manage Book
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Students Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                  <p className="text-gray-600">
                    {classDetails.students.length} student{classDetails.students.length !== 1 ? 's' : ''} enrolled
                  </p>
                </div>
              </div>

              {classDetails.students.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No students enrolled yet</h3>
                    <p className="text-gray-600 mb-4">
                      Share your class code <span className="font-mono font-bold text-blue-600">{classDetails.code}</span> with students to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Enrolled Students</CardTitle>
                    <CardDescription>
                      Students who have joined your class
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
              )}
            </div>
          </div>
        </main>
      </div>
    </TeacherRoute>
  );
} 