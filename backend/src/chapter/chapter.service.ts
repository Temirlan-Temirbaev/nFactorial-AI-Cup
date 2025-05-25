import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, GoogleCloudStorageService } from '../shared/services';
import { SpeechService } from '../shared/services/speech.service';
import { generativeModel } from '@shared/singleton';
import { extractPages } from '@shared/utils';

@Injectable()
export class ChapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: GoogleCloudStorageService,
    private readonly speechService: SpeechService,
  ) {}

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

  async getChapterSummary(chapterId: string) {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          book: true
        }
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      if (chapter.summary) {
        return chapter
      }

      let uploadedChapter: {bucket: string, name: string} | null = null

      if (chapter.fileUri && typeof chapter.fileUri === 'string') {
        uploadedChapter = {
          bucket: chapter.fileUri.split('gs://')[1].split('/')[0],
          name: chapter.fileUri.split('gs://')[1].split('/').slice(1).join('/')
        }
      } else {
        
        const fileName = chapter.book.fileUri.replace('gs://', '').split('/').slice(1).join('/');
        const fileBuffer = await this.storageService.downloadFile(fileName);
        const extractedPages = await extractPages(fileBuffer, chapter.startPage, chapter.endPage);
        
        const chapterBuffer = Buffer.from(extractedPages); 
        uploadedChapter = await this.storageService.uploadFile(
          chapterBuffer, 
          `books/${chapter.book.id}/chapters/${chapter.id}.pdf`,
          {
            metadata: {
              contentType: 'application/pdf',
              chapterId: chapter.id,
              bookId: chapter.book.id,
            },
          }
        );
        await this.prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            fileUri: `gs://${uploadedChapter.bucket}/${uploadedChapter.name}`
          }
        })
      }

      const result = await generativeModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: `gs://${uploadedChapter.bucket}/${uploadedChapter.name}`,
                  mimeType: 'application/pdf'
                }
              },
              {
                fileData: {
                  fileUri: `gs://${process.env.BUCKET_NAME}/summary-template.txt`,
                  mimeType: 'text/plain'
                }
              },
              {
                text: `Create a detailed and structured chapter summary in Markdown format.

Chapter title: ${chapter.title}

Goal: Help students understand and remember key ideas from the chapter.

Content requirements:
1. Clear and understandable presentation of main ideas
2. Highlight key points and concepts
3. Logical structure with subheadings
4. Length: 3-5 informative paragraphs, more if necessary
5. Language: English
6. Use Markdown formatting: headers (##, ###), lists (-, 1.), emphasis (**bold**, _italic_) and tables or quotes when appropriate

Markdown summary structure (example):
## Chapter Title
### Main Ideas
- ...
### Key Concepts
- ...
### Examples (if any)
- ...
### Conclusion
- ...

Create a summary following the above guidelines.`
              }
            ]
          }
        ],
        generationConfig: {
          candidateCount: 1,
        }
      });

      const summary = result.response.candidates[0].content.parts[0].text;

      const updatedChapter = await this.prisma.chapter.update({
        where: { id: chapter.id },
        data: {
          summary
        }
      })

      return updatedChapter

    } catch (error) {
      throw new BadRequestException(`Failed to generate chapter summary: ${error.message}`);
    }
  }

  async generateChapterPodcast(chapterId: string, userId: string) {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          book: true,
          
        }
      });
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      // If podcast already exists, return it
      if (chapter.podcastUrl) {
        return { podcastUrl: chapter.podcastUrl };
      }

      // Generate summary if it doesn't exist
      if (!chapter.summary) {
        await this.getChapterSummary(chapterId);
        // Refetch chapter with summary
        const updatedChapter = await this.prisma.chapter.findUnique({
          where: { id: chapterId }
        });
        chapter.summary = updatedChapter.summary;
      }

      // Create podcast script from summary
      const cleanSummary = this.convertMarkdownToSpeech(chapter.summary);
      const podcastScript = `
Welcome to the podcast.

${cleanSummary}

That's all for today. Thank you for listening!
      `.trim();

      // Generate audio from text
      const audioBuffer = await this.speechService.generateSpeech(podcastScript, user.voicePreference as any);

      // Upload audio to cloud storage
      const audioFileName = `podcasts/${chapter.book.id}/${chapter.id}-${user.voicePreference}-podcast.wav`;
      const uploadedAudio = await this.storageService.uploadFile(
        Buffer.from(audioBuffer),
        audioFileName,
        {
          metadata: {
            contentType: 'audio/wav',
            chapterId: chapter.id,
            bookId: chapter.book.id,
            type: 'podcast'
          },
        },

      );

      // Generate public URL
      const podcastUrl = `https://storage.googleapis.com/${uploadedAudio.bucket}/${uploadedAudio.name}`;

      // Update chapter with podcast URL
      const updatedChapter = await this.prisma.chapter.update({
        where: { id: chapter.id },
        data: {
          podcastUrl
        }
      });

      return { podcastUrl };

    } catch (error) {
      throw new BadRequestException(`Failed to generate chapter podcast: ${error.message}`);
    }
  }

  async generateChapterPresentation(chapterId: string) {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          book: true
        }
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      // If presentation already exists, return it
      if (chapter.presentationUrl) {
        // For slides, we'll store them as JSON in presentationUrl field
        // In a real app, you might want a separate slides table
        try {
          const slides = JSON.parse(chapter.presentationUrl);
          return { slides };
        } catch {
          // If parsing fails, regenerate
        }
      }

      let uploadedChapter: {bucket: string, name: string} | null = null;

      if (chapter.fileUri && typeof chapter.fileUri === 'string') {
        uploadedChapter = {
          bucket: chapter.fileUri.split('gs://')[1].split('/')[0],
          name: chapter.fileUri.split('gs://')[1].split('/').slice(1).join('/')
        };
      } else {
        const fileName = chapter.book.fileUri.replace('gs://', '').split('/').slice(1).join('/');
        const fileBuffer = await this.storageService.downloadFile(fileName);
        const extractedPages = await extractPages(fileBuffer, chapter.startPage, chapter.endPage);
        
        const chapterBuffer = Buffer.from(extractedPages); 
        uploadedChapter = await this.storageService.uploadFile(
          chapterBuffer, 
          `books/${chapter.book.id}/chapters/${chapter.id}.pdf`,
          {
            metadata: {
              contentType: 'application/pdf',
              chapterId: chapter.id,
              bookId: chapter.book.id,
            },
          }
        );
        await this.prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            fileUri: `gs://${uploadedChapter.bucket}/${uploadedChapter.name}`
          }
        });
      }

      const result = await generativeModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: `gs://${uploadedChapter.bucket}/${uploadedChapter.name}`,
                  mimeType: 'application/pdf'
                }
              },
              {
                text: `Create presentation slides from this chapter content.

Chapter title: ${chapter.title}

Requirements:
1. Create 4-8 slides covering the main topics
2. Each slide should have a clear, descriptive title
3. Use "items" layout for all slides
4. Set item_amount based on the number of key points (1-6 items per slide)
5. Write content_description with key points, facts, or concepts
6. Keep content concise but informative
7. Focus on the most important information from the chapter

Return ONLY a valid JSON array in this exact format:
[
  {
    "title": "Slide Title Here",
    "layout": "items", 
    "item_amount": "3",
    "content_description": "Key point 1. Important fact about topic. Another essential concept that students should understand."
  }
]

Make sure:
- Each slide covers different aspects of the chapter
- Content is educational and well-organized
- Descriptions are detailed enough to be useful
- Content is in English
- JSON is properly formatted and valid`
              }
            ]
          }
        ],
        generationConfig: {
          candidateCount: 1,
        }
      });

      const slidesText = result.response.candidates[0].content.parts[0].text;
      
      // Clean up the response to ensure it's valid JSON
      let cleanedSlidesText = slidesText.trim();
      if (cleanedSlidesText.startsWith('```json')) {
        cleanedSlidesText = cleanedSlidesText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedSlidesText.startsWith('```')) {
        cleanedSlidesText = cleanedSlidesText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let slides;
      try {
        slides = JSON.parse(cleanedSlidesText);
      } catch (parseError) {
        throw new BadRequestException(`Failed to parse generated slides: ${parseError.message}`);
      }

      // Validate the slides format
      if (!Array.isArray(slides)) {
        throw new BadRequestException('Generated slides must be an array');
      }

      for (const slide of slides) {
        if (!slide.title || !slide.layout || !slide.item_amount || !slide.content_description) {
          throw new BadRequestException('Each slide must have title, layout, item_amount, and content_description');
        }
      }

      // Store slides as JSON string in presentationUrl field
      const slidesJson = JSON.stringify(slides);
      const res = await fetch('https://api.slidespeak.co/api/v1/presentation/generate/slide-by-slide', {
        method: 'POST',
        body: JSON.stringify({
          slides: slides,
          template: 'nebula'
        }),
        headers: {
          'x-api-key': process.env.SLIDESPEAK_API_KEY,
          'Content-Type': 'application/json'
        }
      }).then((res) => res.json()).then((res : {task_id: string}) => {
        console.log('SlidesSpeak task created:', res);
        
        return res.task_id
      })

      // Poll for task completion
      const maxRetries = 30; // Maximum 30 attempts (5 minutes with 10 second intervals)
      const retryInterval = 10000; // 10 seconds
      
      return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const pollInterval = setInterval(async () => {
          attempts++;
          console.log(`Polling attempt ${attempts}/${maxRetries} for task ${res}`);
          
          try {
            const taskResponse = await fetch(`https://api.slidespeak.co/api/v1/task_status/${res}`, {
              headers: {
                'x-api-key': process.env.SLIDESPEAK_API_KEY,
                'Content-Type': 'application/json'
              }
            });

            if (!taskResponse.ok) {
              throw new Error(`Task status request failed: ${taskResponse.status}`);
            }

            const taskResult = await taskResponse.json() as {
              task_status: string;
              task_result?: {
                url: string;
              };
              error?: string;
            };

            console.log('Task status:', taskResult);

            if (taskResult.task_status === 'SUCCESS') {
              clearInterval(pollInterval);
              
              // Update chapter with the presentation URL
              try {
                await this.prisma.chapter.update({
                  where: { id: chapter.id },
                  data: {
                    presentationUrl: taskResult.task_result.url
                  }
                });

                resolve({ 
                  slides,
                  presentationUrl: taskResult.task_result.url
                });
              } catch (dbError) {
                reject(new BadRequestException(`Failed to save presentation URL: ${dbError.message}`));
              }
            } else if (taskResult.task_status === 'FAILED' || taskResult.task_status === 'ERROR') {
              clearInterval(pollInterval);
              reject(new BadRequestException(`Presentation generation failed: ${taskResult.error || 'Unknown error'}`));
            } else if (taskResult.task_status === 'PENDING' || taskResult.task_status === 'PROCESSING' || taskResult.task_status === 'SENT' || taskResult.task_status === 'STARTED') {
              console.log(`Task still ${taskResult.task_status}, waiting ${retryInterval/1000} seconds for next check...`);
              
              // Check if we've exceeded max attempts
              if (attempts >= maxRetries) {
                clearInterval(pollInterval);
                reject(new BadRequestException(`Presentation generation timed out after ${maxRetries} attempts. The task may still be processing.`));
              }
            } else {
              console.log(`Unknown task status: ${taskResult.task_status}`);
              
              // Check if we've exceeded max attempts for unknown status too
              if (attempts >= maxRetries) {
                clearInterval(pollInterval);
                reject(new BadRequestException(`Presentation generation timed out with unknown status: ${taskResult.task_status}`));
              }
            }
          } catch (pollError) {
            console.error(`Polling attempt ${attempts} failed:`, pollError);
            
            // If we've exceeded max attempts, stop and reject
            if (attempts >= maxRetries) {
              clearInterval(pollInterval);
              reject(new BadRequestException(`Failed to get presentation status after ${maxRetries} attempts: ${pollError.message}`));
            }
            // Otherwise, continue polling (the interval will trigger again)
          }
        }, retryInterval);
        
        // Safety timeout to prevent infinite polling
        setTimeout(() => {
          clearInterval(pollInterval);
          reject(new BadRequestException('Presentation generation timed out - safety timeout reached'));
        }, maxRetries * retryInterval + 5000); // Extra 5 seconds buffer
      });

    } catch (error) {
      throw new BadRequestException(`Failed to generate chapter presentation: ${error.message}`);
    }
  }
}
