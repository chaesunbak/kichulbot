import {
  AdminTaxonomyResponse,
  ListSubjectsResponse,
  ListSubjectsResponseSchema,
  TaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';
import { Injectable } from '@nestjs/common';
import { Subject, UserRole } from '@prisma/client';
import { SubjectsRepository } from './subjects.repository';

@Injectable()
export class SubjectsService {
  constructor(private readonly subjectsRepository: SubjectsRepository) {}

  async listSubjects(role: UserRole): Promise<ListSubjectsResponse> {
    const subjects = await this.subjectsRepository.findMany();
    return ListSubjectsResponseSchema.parse({
      subjects: subjects.map((subject) => this.toResponse(subject, role)),
    });
  }

  findById(id: string) {
    return this.subjectsRepository.findById(id);
  }

  private toResponse(
    subject: Subject,
    role: UserRole,
  ): TaxonomyResponse | AdminTaxonomyResponse {
    const response = {
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    };
  }
}
