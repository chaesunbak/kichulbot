import {
  AddLibraryPaperRequestSchema,
  DeleteLibraryFolderResponseSchema,
  DeleteLibraryPaperResponseSchema,
  CreateLibraryFolderRequestSchema,
  LibraryFolderResponseEnvelopeSchema,
  LibraryPaperResponseEnvelopeSchema,
  LibraryResponseSchema,
  MoveLibraryPaperRequestSchema,
  UpdateLibraryFolderRequestSchema,
} from './dto.js';

export const libraryRoutes = {
  getLibrary: {
    method: 'GET',
    path: '/me/library',
    request: null,
    response: LibraryResponseSchema,
  },
  createFolder: {
    method: 'POST',
    path: '/me/library/folders',
    request: CreateLibraryFolderRequestSchema,
    response: LibraryFolderResponseEnvelopeSchema,
  },
  updateFolder: {
    method: 'PATCH',
    path: '/me/library/folders/:folderId',
    request: UpdateLibraryFolderRequestSchema,
    response: LibraryFolderResponseEnvelopeSchema,
  },
  deleteFolder: {
    method: 'DELETE',
    path: '/me/library/folders/:folderId',
    request: null,
    response: DeleteLibraryFolderResponseSchema,
  },
  addLibraryPaper: {
    method: 'PUT',
    path: '/me/library/exam-papers/:paperId',
    request: AddLibraryPaperRequestSchema,
    response: LibraryPaperResponseEnvelopeSchema,
  },
  moveLibraryPaper: {
    method: 'PATCH',
    path: '/me/library/papers/:libraryPaperId',
    request: MoveLibraryPaperRequestSchema,
    response: LibraryPaperResponseEnvelopeSchema,
  },
  deleteLibraryPaper: {
    method: 'DELETE',
    path: '/me/library/papers/:libraryPaperId',
    request: null,
    response: DeleteLibraryPaperResponseSchema,
  },
} as const;
