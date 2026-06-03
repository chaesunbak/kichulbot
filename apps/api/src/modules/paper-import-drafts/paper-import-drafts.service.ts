import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';

import {
  PaperImportDraftResponse,
  PaperImportDraftResponseSchema,
} from '@kichulbot/api-contract/papers';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';

const DEFAULT_LAYOUT = 'korean-history';
const DEFAULT_VARIANT = 'odd';
const DEFAULT_DPI = 216;
const DEFAULT_IMAGE_FORMAT = 'webp';
const DEFAULT_QUALITY = 82;
const SCRIPT_TIMEOUT_MS = 120_000;

type CreateDraftInput = {
  questionPdf?: UploadedMemoryFile;
  answerPdf?: UploadedMemoryFile;
  options: Record<string, string | undefined>;
};

type QuestionManifest = {
  source?: string;
  questions?: Array<{
    number: number;
    image: string;
  }>;
};

type AnswerManifest = {
  answers?: Array<{
    number: number;
    answer_index?: number;
    points?: number;
  }>;
  warnings?: string[];
};

@Injectable()
export class PaperImportDraftsService {
  async createDraft(
    input: CreateDraftInput,
  ): Promise<PaperImportDraftResponse> {
    const { questionPdf, answerPdf } = input;
    if (!questionPdf) {
      throw new BadRequestException('문제 PDF를 업로드해주세요.');
    }
    if (!answerPdf) {
      throw new BadRequestException('답지 PDF를 업로드해주세요.');
    }
    this.assertPdf(questionPdf, '문제 PDF');
    this.assertPdf(answerPdf, '답지 PDF');

    const options = this.resolveOptions(input.options);
    const workDir = await mkdtemp(join(tmpdir(), 'kichulbot-paper-import-'));

    try {
      const questionPdfPath = join(workDir, `questions-${randomUUID()}.pdf`);
      const answerPdfPath = join(workDir, `answers-${randomUUID()}.pdf`);
      const questionOutRoot = join(workDir, 'question-output');
      const answerOutRoot = join(workDir, 'answer-output');

      await Promise.all([
        writeFile(questionPdfPath, questionPdf.buffer),
        writeFile(answerPdfPath, answerPdf.buffer),
      ]);

      const { pythonBin, questionScript, answerScript } =
        this.resolveScriptPaths();
      await this.runPython(
        questionScript,
        [
          questionPdfPath,
          '--layout',
          options.layout,
          '--variant',
          options.variant,
          '--dpi',
          String(options.dpi),
          '--image-format',
          options.imageFormat,
          '--quality',
          String(options.quality),
          '--out',
          questionOutRoot,
        ],
        pythonBin,
      );
      await this.runPython(
        answerScript,
        [answerPdfPath, '--out', answerOutRoot],
        pythonBin,
      );

      const questionDir = await this.findOutputDir(
        questionOutRoot,
        'manifest.json',
      );
      const answerDir = await this.findOutputDir(answerOutRoot, 'answers.json');
      const manifest = await this.readJson<QuestionManifest>(
        join(questionDir, 'manifest.json'),
      );
      const answers = await this.readJson<AnswerManifest>(
        join(answerDir, 'answers.json'),
      );

      return this.toResponse(
        manifest,
        answers,
        questionDir,
        questionPdf.originalname,
      );
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private resolveOptions(options: Record<string, string | undefined>) {
    const dpi = Number(options.dpi ?? DEFAULT_DPI);
    const quality = Number(options.quality ?? DEFAULT_QUALITY);
    return {
      layout: options.layout || DEFAULT_LAYOUT,
      variant: options.variant || DEFAULT_VARIANT,
      dpi: Number.isFinite(dpi) ? dpi : DEFAULT_DPI,
      imageFormat: options.imageFormat || DEFAULT_IMAGE_FORMAT,
      quality: Number.isFinite(quality) ? quality : DEFAULT_QUALITY,
    };
  }

  private assertPdf(file: UploadedMemoryFile, label: string) {
    if (
      file.mimetype !== 'application/pdf' &&
      extname(file.originalname).toLowerCase() !== '.pdf'
    ) {
      throw new BadRequestException(
        `${label}는 PDF 파일만 업로드할 수 있습니다.`,
      );
    }
  }

  private resolveScriptPaths() {
    const cwd = process.cwd();
    const candidates = [
      cwd,
      resolve(cwd, '../..'),
      resolve(__dirname, '../../../../../..'),
    ];
    for (const root of candidates) {
      const questionScript = join(
        root,
        'tools/question-extractor/extract_questions.py',
      );
      const answerScript = join(
        root,
        'tools/question-extractor/extract_answers.py',
      );
      if (existsSync(questionScript) && existsSync(answerScript)) {
        const venvPython = join(
          root,
          'tools/question-extractor/.venv/bin/python',
        );
        return {
          pythonBin: existsSync(venvPython) ? venvPython : 'python3',
          questionScript,
          answerScript,
        };
      }
    }
    throw new InternalServerErrorException(
      'PDF 추출 스크립트를 찾을 수 없습니다.',
    );
  }

  private runPython(scriptPath: string, args: string[], pythonBin = 'python3') {
    return new Promise<void>((resolvePromise, reject) => {
      const child = spawn(pythonBin, [scriptPath, ...args], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let stderr = '';
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(
          new InternalServerErrorException('PDF 추출 시간이 초과되었습니다.'),
        );
      }, SCRIPT_TIMEOUT_MS);

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(
          new InternalServerErrorException(
            `PDF 추출 스크립트를 실행하지 못했습니다: ${error.message}`,
          ),
        );
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolvePromise();
          return;
        }
        reject(
          new InternalServerErrorException(
            stderr.trim() || 'PDF 추출 스크립트가 실패했습니다.',
          ),
        );
      });
    });
  }

  private async findOutputDir(root: string, markerFile: string) {
    const entries = await readdir(root, { withFileTypes: true });
    const dirs = entries.filter((entry) => entry.isDirectory());
    for (const dir of dirs) {
      const fullPath = join(root, dir.name);
      if (existsSync(join(fullPath, markerFile))) {
        return fullPath;
      }
    }
    throw new InternalServerErrorException('PDF 추출 결과를 찾을 수 없습니다.');
  }

  private async readJson<T>(path: string): Promise<T> {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  }

  private async toResponse(
    manifest: QuestionManifest,
    answerManifest: AnswerManifest,
    questionDir: string,
    sourceName: string,
  ) {
    const answers = new Map(
      (answerManifest.answers ?? []).map((answer) => [answer.number, answer]),
    );
    const warnings = [...(answerManifest.warnings ?? [])];
    const questions = await Promise.all(
      [...(manifest.questions ?? [])]
        .sort((a, b) => a.number - b.number)
        .map(async (question) => {
          const answer = answers.get(question.number);
          if (!answer) {
            warnings.push(
              `${question.number}번 문항의 답안을 찾지 못했습니다.`,
            );
          }
          const imagePath = join(questionDir, question.image);
          const image = await readFile(imagePath);
          return {
            number: question.number,
            type: 'MULTIPLE_CHOICE' as const,
            choiceCount: 5,
            answerChoice: answer?.answer_index ?? null,
            answerText: null,
            explanation: null,
            points: answer?.points ?? 5,
            recommendedTimeSeconds: null,
            tagIds: [],
            image: {
              filename: basename(question.image),
              mimeType: this.resolveMimeType(question.image),
              base64: image.toString('base64'),
            },
          };
        }),
    );

    return PaperImportDraftResponseSchema.parse({
      paperSuggestion: {
        title: sourceName.replace(/\.pdf$/i, ''),
        questionCount: questions.length,
      },
      warnings,
      questions,
    });
  }

  private resolveMimeType(path: string) {
    const extension = extname(path).toLowerCase();
    if (extension === '.png') return 'image/png';
    if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
    return 'image/webp';
  }
}
