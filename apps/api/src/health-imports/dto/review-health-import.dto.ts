import { ApiProperty } from '@nestjs/swagger';

export class ReviewHealthImportCandidatesDto {
  @ApiProperty({
    type: String,
    isArray: true,
    example: ['health_candidate_123'],
  })
  candidateIds!: string[];
}
