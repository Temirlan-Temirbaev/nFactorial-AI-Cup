'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TeacherRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useBook, useBookChapters } from '@/hooks/useBooks';
import { useGetChapterSummary, useGenerateChapterPodcast, useGenerateChapterPresentation } from '@/hooks/useChapters';
import { useGenerateChapterTest, useHasChapterTest, useChapterTest } from '@/hooks/useTests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Book, FileText, Headphones, ClipboardList, Play, Download, ExternalLink, Pause, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import type { BookChapters } from '@/lib/api';
import type { GeneratedTest } from '@/lib/api/tests';
import ReactMarkdown from 'react-markdown';
export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookId = params.id as string;
  
  const { data: book, isLoading: bookLoading, error: bookError } = useBook(bookId);
  const { data: bookChapters, isLoading: chaptersLoading, error: chaptersError } = useBookChapters(bookId);
  
  const getSummaryMutation = useGetChapterSummary();
  const generatePodcastMutation = useGenerateChapterPodcast();
  const generatePresentationMutation = useGenerateChapterPresentation();
  const generateTestMutation = useGenerateChapterTest();
  
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'summary' | 'podcast' | 'presentation' | 'test' | null>(null);
  
  // Audio state
  const [playingChapter, setPlayingChapter] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Modal states
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedSummaryChapter, setSelectedSummaryChapter] = useState<BookChapters['chapters'][0] | null>(null);
  const [selectedTestChapter, setSelectedTestChapter] = useState<string | null>(null);

  const isLoading = bookLoading || chaptersLoading;
  const error = bookError || chaptersError;

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleGenerateSummary = async (chapterId: string) => {
    try {
      setActiveAction('summary');
      await getSummaryMutation.mutateAsync(chapterId);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setActiveAction(null);
    }
  };

  const handleGeneratePodcast = async (chapterId: string) => {
    try {
      setActiveAction('podcast');
      await generatePodcastMutation.mutateAsync(chapterId);
    } catch (error) {
      console.error('Failed to generate podcast:', error);
    } finally {
      setActiveAction(null);
    }
  };

  const handleGeneratePresentation = async (chapterId: string) => {
    try {
      setActiveAction('presentation');
      await generatePresentationMutation.mutateAsync(chapterId);
    } catch (error) {
      console.error('Failed to generate presentation:', error);
    } finally {
      setActiveAction(null);
    }
  };

  const handleGenerateTest = async (chapterId: string) => {
    try {
      setActiveAction('test');
      await generateTestMutation.mutateAsync({ chapterId });
    } catch (error) {
      console.error('Failed to generate test:', error);
    } finally {
      setActiveAction(null);
    }
  };

  const handleAudioToggle = (chapterId: string, podcastUrl: string) => {
    if (playingChapter === chapterId && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Start new audio
      const audio = new Audio(podcastUrl);
      audioRef.current = audio;
      setPlayingChapter(chapterId);
      setIsPlaying(true);
      
      audio.play();
      
      audio.onended = () => {
        setIsPlaying(false);
        setPlayingChapter(null);
        audioRef.current = null;
      };
      
      audio.onpause = () => {
        setIsPlaying(false);
      };
      
      audio.onplay = () => {
        setIsPlaying(true);
      };
    }
  };

  const handleViewSummary = (chapter: BookChapters['chapters'][0]) => {
    setSelectedSummaryChapter(chapter);
    setSummaryModalOpen(true);
  };

  const handleViewTest = (chapterId: string) => {
    setSelectedTestChapter(chapterId);
    setTestModalOpen(true);
  };

  if (isLoading) {
    return (
      <TeacherRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading book details...</p>
          </div>
        </div>
      </TeacherRoute>
    );
  }

  if (error || !book || !bookChapters) {
    return (
      <TeacherRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load book details.</p>
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
                  Back to Class
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
                  <p className="text-sm text-gray-600">
                    {bookChapters.chapters.length} chapter{bookChapters.chapters.length !== 1 ? 's' : ''}
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
            {/* Book Overview */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Book className="w-8 h-8 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{book.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Uploaded on {new Date(book.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Chapters</p>
                      <p className="text-xl font-bold text-gray-900">{bookChapters.chapters.length}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <ClipboardList className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Generated Summaries</p>
                      <p className="text-xl font-bold text-gray-900">
                        {bookChapters.chapters.filter(ch => ch.summary).length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Headphones className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Podcasts</p>
                      <p className="text-xl font-bold text-gray-900">
                        {bookChapters.chapters.filter(ch => ch.podcastUrl).length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <ExternalLink className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Presentations</p>
                      <p className="text-xl font-bold text-gray-900">
                        {bookChapters.chapters.filter(ch => ch.presentationUrl).length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <ClipboardList className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Tests Created</p>
                      <p className="text-xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chapters List */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chapters</h2>
                <p className="text-gray-600">Manage content for each chapter</p>
              </div>

              <div className="space-y-4">
                {bookChapters.chapters.map((chapter, index) => (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    onGenerateSummary={handleGenerateSummary}
                    onGeneratePodcast={handleGeneratePodcast}
                    onGeneratePresentation={handleGeneratePresentation}
                    onGenerateTest={handleGenerateTest}
                    isGenerating={activeAction !== null}
                    activeAction={activeAction}
                    playingChapter={playingChapter}
                    isPlaying={isPlaying}
                    onAudioToggle={handleAudioToggle}
                    onViewSummary={handleViewSummary}
                    onViewTest={handleViewTest}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Summary Modal */}
        <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chapter Summary: {selectedSummaryChapter?.title}</DialogTitle>
              <DialogDescription>
                Pages {selectedSummaryChapter?.startPage} - {selectedSummaryChapter?.endPage}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedSummaryChapter?.summary ? (
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-wrap  leading-relaxed">
                    <ReactMarkdown>{selectedSummaryChapter.summary}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No summary available for this chapter.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Test Modal */}
        {selectedTestChapter && (
          <TestModal 
            chapterId={selectedTestChapter}
            isOpen={testModalOpen}
            onClose={() => setTestModalOpen(false)}
          />
        )}
      </div>
    </TeacherRoute>
  );
}

// Test Modal Component
interface TestModalProps {
  chapterId: string;
  isOpen: boolean;
  onClose: () => void;
}

function TestModal({ chapterId, isOpen, onClose }: TestModalProps) {
  const { data: test, isLoading, error } = useChapterTest(chapterId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (test?.questions) {
      setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1));
    }
  };

  const currentQuestion = test?.questions[currentQuestionIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test?.title || 'Chapter Test'}</DialogTitle>
          <DialogDescription>
            {test?.description || 'Test questions for this chapter'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading test...</span>
          </div>
        ) : error || !test ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load test or test not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Question Navigation */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </span>
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === test.questions.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                Created: {new Date(test.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentQuestion.questionText}
                  </h3>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          option.isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            option.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="flex-1 text-gray-900">{option.optionText}</span>
                          {option.isCorrect && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                
              </div>
            )}

            
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ChapterCardProps {
  chapter: BookChapters['chapters'][0];
  index: number;
  onGenerateSummary: (id: string) => void;
  onGeneratePodcast: (id: string) => void;
  onGeneratePresentation: (id: string) => void;
  onGenerateTest: (id: string) => void;
  isGenerating: boolean;
  activeAction: 'summary' | 'podcast' | 'presentation' | 'test' | null;
  playingChapter: string | null;
  isPlaying: boolean;
  onAudioToggle: (chapterId: string, podcastUrl: string) => void;
  onViewSummary: (chapter: BookChapters['chapters'][0]) => void;
  onViewTest: (chapterId: string) => void;
}

function ChapterCard({ 
  chapter, 
  index, 
  onGenerateSummary, 
  onGeneratePodcast, 
  onGeneratePresentation,
  onGenerateTest,
  isGenerating,
  activeAction,
  playingChapter,
  isPlaying,
  onAudioToggle,
  onViewSummary,
  onViewTest
}: ChapterCardProps) {
  const { hasTest } = useHasChapterTest(chapter.id);
  const isCurrentlyPlaying = playingChapter === chapter.id && isPlaying;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{chapter.title}</CardTitle>
              <CardDescription>
                Pages {chapter.startPage} - {chapter.endPage}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {chapter.summary && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <FileText className="w-3 h-3 mr-1" />
                Summary
              </Badge>
            )}
            {chapter.podcastUrl && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Headphones className="w-3 h-3 mr-1" />
                Podcast
              </Badge>
            )}
            {chapter.presentationUrl && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                <ExternalLink className="w-3 h-3 mr-1" />
                Presentation
              </Badge>
            )}
            {hasTest && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <ClipboardList className="w-3 h-3 mr-1" />
                Test
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Summary */}
          <div className="space-y-2">
            {chapter.summary ? (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Summary Ready</span>
                  <Button size="sm" onClick={() => onViewSummary(chapter)}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1">AI-generated summary available</p>
              </div>
            ) : (
              <Button 
                onClick={() => onGenerateSummary(chapter.id)}
                disabled={isGenerating}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isGenerating && activeAction === 'summary' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Podcast */}
          <div className="space-y-2">
            {chapter.podcastUrl ? (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">Podcast Ready</span>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => chapter.podcastUrl && onAudioToggle(chapter.id, chapter.podcastUrl)}>
                      {isCurrentlyPlaying ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-1">AI-generated podcast available</p>
              </div>
            ) : (
              <Button 
                onClick={() => onGeneratePodcast(chapter.id)}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                {isGenerating && activeAction === 'podcast' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Headphones className="w-3 h-3 mr-2" />
                    Generate Podcast
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Presentation */}
          <div className="space-y-2">
            {chapter.presentationUrl ? (
              <div className="p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800">Presentation Ready</span>
                  <Button size="sm" onClick={() => window.open(chapter.presentationUrl, '_blank')}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-xs text-indigo-600 mt-1">AI-generated presentation available</p>
              </div>
            ) : (
              <Button 
                onClick={() => onGeneratePresentation(chapter.id)}
                disabled={isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                {isGenerating && activeAction === 'presentation' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Generate Presentation
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Test */}
          <div className="space-y-2">
            {hasTest ? (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-800">Test Ready</span>
                  <Button size="sm" onClick={() => onViewTest(chapter.id)}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-xs text-orange-600 mt-1">AI-generated test available</p>
              </div>
            ) : (
              <Button 
                onClick={() => onGenerateTest(chapter.id)}
                disabled={isGenerating}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                {isGenerating && activeAction === 'test' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-3 h-3 mr-2" />
                    Generate Test
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 