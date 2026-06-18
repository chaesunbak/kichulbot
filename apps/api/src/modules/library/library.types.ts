import type { LibraryResponse } from '@kichulbot/api-contract/library';

import type { LibraryRepository } from './library.repository';

export type LibraryFolderItem = LibraryResponse['folders'][number];
export type LibraryPaperItem = LibraryResponse['papers'][number];

export type LibraryPaperRecord = Awaited<
  ReturnType<LibraryRepository['findLibraryPapers']>
>[number];
