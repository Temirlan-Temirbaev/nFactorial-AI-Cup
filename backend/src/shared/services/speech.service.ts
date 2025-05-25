import { Logger } from '@nestjs/common'
import { Buffer } from 'node:buffer'
import OpenAI from 'openai'

export class SpeechService {
  private speechClient: OpenAI
  private readonly logger = new Logger(SpeechService.name);

  constructor() {
    this.speechClient = new OpenAI({
      apiKey: process.env.LEMONFOX_API_KEY,
      baseURL: 'https://api.lemonfox.ai/v1',
    })
  }

  async generateSpeech(text: string, voice?: 'bella' | 'santa' | 'sarah' | 'michael') {
    this.logger.log({ text, voice, msg: 'Generating speech' })
    const audio = await this.speechClient.audio.speech.create({
      input: text,
      voice: voice.toLowerCase(),
      response_format: 'wav',
      model: 'tts-1',
    })

    const uint8Array = new Uint8Array(await audio.arrayBuffer())
    return uint8Array
  }

  async downloadAudio(url: string) {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer
  }

}
