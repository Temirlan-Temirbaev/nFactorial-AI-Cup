'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StudentRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useBook, useBookChapters } from '@/hooks/useBooks';
import { useHasChapterTest, useChapterTest } from '@/hooks/useTests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Book, FileText, Headphones, ClipboardList, Play, Pause, ExternalLink, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import type { BookChapters } from '@/lib/api';
import type { GeneratedTest } from '@/lib/api/tests';
import ReactMarkdown from 'react-markdown';

export default function StudentBookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookId = params.id as string;
  
  const { data: book, isLoading: bookLoading, error: bookError } = useBook(bookId);
  const { data: bookChapters, isLoading: chaptersLoading, error: chaptersError } = useBookChapters(bookId);
  
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
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading book details...</p>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (error || !book || !bookChapters) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load book details.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
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
                <span className="text-sm text-gray-700">
                  Student: {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </span>
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
                      <p className="text-sm text-gray-600">Available Summaries</p>
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
                      <p className="text-sm text-gray-600">Tests Available</p>
                      <p className="text-xl font-bold text-gray-900">
                        {bookChapters.chapters.filter(ch => {
                          // This would need to be calculated properly, for now showing 0
                          // In a real app, you'd want to batch check test availability
                          return false; // Placeholder - individual hooks don't work well for counting
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chapters List */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chapters</h2>
                <p className="text-gray-600">Read chapters and access available content</p>
              </div>

              <div className="space-y-4">
                {bookChapters.chapters.map((chapter, index) => (
                  <StudentChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
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
                  <div className="whitespace-pre-wrap leading-relaxed">
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
          <StudentTestModal 
            chapterId={selectedTestChapter}
            isOpen={testModalOpen}
            onClose={() => setTestModalOpen(false)}
          />
        )}
      </div>
    </StudentRoute>
  );
}

// Student Test Modal Component (interactive)
interface StudentTestModalProps {
  chapterId: string;
  isOpen: boolean;
  onClose: () => void;
}

function StudentTestModal({ chapterId, isOpen, onClose }: StudentTestModalProps) {
  const { data: test, isLoading, error } = useChapterTest(chapterId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  if (!isOpen) return null;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setSubmittedQuestions(new Set());
      setSelectedOption(null);
    }
  }, [isOpen]);

  // Reset selection when changing questions
  useEffect(() => {
    if (test?.questions[currentQuestionIndex]) {
      const questionId = test.questions[currentQuestionIndex].id;
      setSelectedOption(userAnswers[questionId] || null);
    }
  }, [currentQuestionIndex, test, userAnswers]);

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (test?.questions) {
      setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1));
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (test?.questions[currentQuestionIndex]) {
      const questionId = test.questions[currentQuestionIndex].id;
      if (!submittedQuestions.has(questionId)) {
        setSelectedOption(optionId);
      }
    }
  };

  const handleSubmitAnswer = () => {
    if (test?.questions[currentQuestionIndex] && selectedOption) {
      const questionId = test.questions[currentQuestionIndex].id;
      setUserAnswers(prev => ({ ...prev, [questionId]: selectedOption }));
      setSubmittedQuestions(prev => new Set([...prev, questionId]));
    }
  };

  const currentQuestion = test?.questions[currentQuestionIndex];
  const isQuestionSubmitted = currentQuestion ? submittedQuestions.has(currentQuestion.id) : false;
  const userAnswer = currentQuestion ? userAnswers[currentQuestion.id] : null;
  const correctOption = currentQuestion?.options.find(opt => opt.isCorrect);
  const isCorrectAnswer = userAnswer === correctOption?.id;

  const getQuestionStatus = (questionIndex: number) => {
    const question = test?.questions[questionIndex];
    if (!question) return 'unanswered';
    
    const questionId = question.id;
    if (submittedQuestions.has(questionId)) {
      const answer = userAnswers[questionId];
      const correct = question.options.find(opt => opt.isCorrect);
      return answer === correct?.id ? 'correct' : 'incorrect';
    }
    return userAnswers[questionId] ? 'selected' : 'unanswered';
  };

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
            <p className="text-gray-600">No test available for this chapter yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            

            {/* Question Overview */}
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600 mr-2">Questions:</span>
              {test.questions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : status === 'correct'
                        ? 'bg-green-500 text-white'
                        : status === 'incorrect'
                        ? 'bg-red-500 text-white'
                        : status === 'selected'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentQuestion.questionText}
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOption === option.id;
                      const isCorrect = option.isCorrect;
                      const showResult = isQuestionSubmitted;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionSelect(option.id)}
                          disabled={isQuestionSubmitted}
                          className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                            showResult
                              ? isCorrect
                                ? 'border-green-500 bg-green-50'
                                : userAnswer === option.id
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          } ${isQuestionSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                              showResult
                                ? isCorrect
                                  ? 'bg-green-500 text-white'
                                  : userAnswer === option.id
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                                : isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1 text-gray-900">{option.optionText}</span>
                            {showResult && isCorrect && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {showResult && userAnswer === option.id && !isCorrect && (
                              <span className="w-5 h-5 text-red-500">✗</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit/Result Section */}
                  {!isQuestionSubmitted ? (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedOption}
                        className="px-8"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      {isCorrectAnswer ? (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center space-x-2 text-green-800">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Correct!</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">Well done! You got the right answer.</p>
                        </div>
                      ) : (
                        <div className="p-4 bg-red-50 rounded-lg">
                          <div className="flex items-center justify-center space-x-2 text-red-800 mb-2">
                            <span className="w-5 h-5 text-red-500">✗</span>
                            <span className="font-medium">Incorrect</span>
                          </div>
                          <p className="text-sm text-red-700">
                            The correct answer is: <span className="font-medium">{correctOption?.optionText}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StudentChapterCardProps {
  chapter: BookChapters['chapters'][0];
  index: number;
  playingChapter: string | null;
  isPlaying: boolean;
  onAudioToggle: (chapterId: string, podcastUrl: string) => void;
  onViewSummary: (chapter: BookChapters['chapters'][0]) => void;
  onViewTest: (chapterId: string) => void;
}

function StudentChapterCard({ 
  chapter, 
  index, 
  playingChapter,
  isPlaying,
  onAudioToggle,
  onViewSummary,
  onViewTest
}: StudentChapterCardProps) {
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
                  <span className="text-sm font-medium text-green-800">Summary Available</span>
                  <Button size="sm" onClick={() => onViewSummary(chapter)}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Read
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1">AI-generated summary available</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">No Summary</span>
                <p className="text-xs text-gray-500 mt-1">Summary not yet available</p>
              </div>
            )}
          </div>

          {/* Podcast */}
          <div className="space-y-2">
            {chapter.podcastUrl ? (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">Podcast Available</span>
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
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">No Podcast</span>
                <p className="text-xs text-gray-500 mt-1">Podcast not yet available</p>
              </div>
            )}
          </div>

          {/* Presentation */}
          <div className="space-y-2">
            {chapter.presentationUrl ? (
              <div className="p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800">Presentation Available</span>
                  <Button size="sm" onClick={() => window.open(chapter.presentationUrl, '_blank')}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-xs text-indigo-600 mt-1">AI-generated presentation available</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">No Presentation</span>
                <p className="text-xs text-gray-500 mt-1">Presentation not yet available</p>
              </div>
            )}
          </div>

          {/* Test */}
          <div className="space-y-2">
            {hasTest ? (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-800">Test Available</span>
                  <Button size="sm" onClick={() => onViewTest(chapter.id)}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Take
                  </Button>
                </div>
                <p className="text-xs text-orange-600 mt-1">AI-generated test available</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">No Test</span>
                <p className="text-xs text-gray-500 mt-1">Test not yet available</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 