export class BookChaptersDto {
  book: {
    id: string;
    title: string;
    createdAt: Date;
  };
  chapters: Array<{
    id: string;
    title: string;
    startPage: number;
    endPage: number;
  }>;
} 