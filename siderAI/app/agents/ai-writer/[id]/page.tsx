'use client';

import { useParams } from 'next/navigation';
import AIWriterEditor from '../../../components/AIWriterEditor';

export default function AIWriterEditorPage() {
  const params = useParams();
  const documentId = (params?.id as string) || '01';

  return <AIWriterEditor documentId={documentId} />;
}

