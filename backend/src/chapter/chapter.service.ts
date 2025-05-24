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
Welcome to the podcast for chapter "${chapter.title}".

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
          makePublic: true
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
}
