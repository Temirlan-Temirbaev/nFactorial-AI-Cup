import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/services';
import { CreateTestDto, GeneratedTestDto } from './dto';
import { generativeModel } from '@shared/singleton';
import { extractJsonBlock } from '@shared/utils';

@Injectable()
export class TestService {
  constructor(private readonly prisma: PrismaService) {}

  private convertMarkdownToSpeech(markdownText: string): string {
    if (!markdownText) return '';
    
    let speechText = markdownText;
    
    // Remove markdown headers and replace with natural speech
    speechText = speechText.replace(/^#{1,6}\s+(.+)$/gm, '$1.');
    
    // Convert bold text
    speechText = speechText.replace(/\*\*(.*?)\*\*/g, '$1');
    speechText = speechText.replace(/__(.*?)__/g, '$1');
    
    // Convert italic text  
    speechText = speechText.replace(/\*(.*?)\*/g, '$1');
    speechText = speechText.replace(/_(.*?)_/g, '$1');
    
    // Convert unordered lists to natural speech
    speechText = speechText.replace(/^[\s]*[-\*\+]\s+(.+)$/gm, '$1.');
    
    // Convert ordered lists to natural speech
    speechText = speechText.replace(/^[\s]*\d+\.\s+(.+)$/gm, '$1.');
    
    // Remove code blocks
    speechText = speechText.replace(/```[\s\S]*?```/g, '');
    speechText = speechText.replace(/`([^`]+)`/g, '$1');
    
    // Remove links and keep only the text
    speechText = speechText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove HTML tags if any
    speechText = speechText.replace(/<[^>]*>/g, '');
    
    // Clean up multiple spaces and newlines
    speechText = speechText.replace(/\n{3,}/g, '\n\n');
    speechText = speechText.replace(/[ ]{2,}/g, ' ');
    
    // Remove empty lines at start/end
    speechText = speechText.trim();
    
    return speechText;
  }

  async generateChapterTest(chapterId: string, createTestDto?: CreateTestDto): Promise<GeneratedTestDto> {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          book: true,
          test: {
            include: {
              questions: {
                include: {
                  options: true
                }
              }
            }
          }
        }
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      // If test already exists, return it
      if (chapter.test) {
        return {
          id: chapter.test.id,
          title: chapter.test.title,
          description: chapter.test.description,
          questions: chapter.test.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options.map(o => ({
              id: o.id,
              optionText: o.optionText,
              isCorrect: o.isCorrect
            }))
          })),
          createdAt: chapter.test.createdAt
        };
      }

      // Check if chapter has summary, if not throw error (should be generated first)
      if (!chapter.summary) {
        throw new BadRequestException('Chapter summary must be generated first before creating a test');
      }

      const numberOfQuestions = createTestDto?.numberOfQuestions || 5;
      const testTitle = createTestDto?.title || `Test for Chapter: ${chapter.title}`;
      const testDescription = createTestDto?.description || `Multiple choice test based on chapter content`;

      // Generate test questions using AI
      const result = await generativeModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Create a multiple choice test based on this chapter content.

Chapter Title: ${chapter.title}
Chapter Content: ${this.convertMarkdownToSpeech(chapter.summary)}

Requirements:
1. Generate exactly ${numberOfQuestions} questions
2. Each question must have exactly 4 options (A, B, C, D)
3. Only 1 option should be correct per question
4. Questions should test understanding of key concepts
5. Language: English
6. Return in JSON format only:

{
  "questions": [
    {
      "questionText": "Question text here?",
      "options": [
        {
          "optionText": "Option A text",
          "isCorrect": true
        },
        {
          "optionText": "Option B text", 
          "isCorrect": false
        },
        {
          "optionText": "Option C text",
          "isCorrect": false
        },
        {
          "optionText": "Option D text",
          "isCorrect": false
        }
      ]
    }
  ]
}

Generate the test questions now.`
              }
            ]
          }
        ],
        generationConfig: {
          candidateCount: 1,
        }
      });

      const testData = extractJsonBlock(result.response.candidates[0].content.parts[0].text);

      // Create test in database
      const test = await this.prisma.test.create({
        data: {
          title: testTitle,
          description: testDescription,
          chapterId: chapter.id,
          questions: {
            create: testData.questions.map((question: any) => ({
              questionText: question.questionText,
              options: {
                create: question.options.map((option: any) => ({
                  optionText: option.optionText,
                  isCorrect: option.isCorrect
                }))
              }
            }))
          }
        },
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      });

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        questions: test.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options.map(o => ({
            id: o.id,
            optionText: o.optionText,
            isCorrect: o.isCorrect
          }))
        })),
        createdAt: test.createdAt
      };

    } catch (error) {
      throw new BadRequestException(`Failed to generate chapter test: ${error.message}`);
    }
  }

  async getChapterTest(chapterId: string): Promise<GeneratedTestDto> {
    return this.generateChapterTest(chapterId);
  }
}
