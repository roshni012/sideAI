'use client';

import { useParams } from 'next/navigation';
import AIImageGenerator from '../../../components/AIImageGenerator';
import BackgroundRemover from '../../../components/BackgroundRemover';
import TextRemover from '../../../components/TextRemover';
import PhotoEraser from '../../../components/PhotoEraser';
import Inpaint from '../../../components/Inpaint';
import ImageUpscaler from '../../../components/ImageUpscaler';
import BackgroundChanger from '../../../components/BackgroundChanger';

export default function CreateImagePage() {
  const params = useParams();
  const tool = params?.tool as string;

  if (tool === 'background-remover') {
    return <BackgroundRemover />;
  }

  if (tool === 'text-remover') {
    return <TextRemover />;
  }

  if (tool === 'photo-eraser') {
    return <PhotoEraser />;
  }

  if (tool === 'inpaint') {
    return <Inpaint />;
  }

  if (tool === 'image-upscaler') {
    return <ImageUpscaler />;
  }

  if (tool === 'background-changer') {
    return <BackgroundChanger />;
  }

  return <AIImageGenerator tool={tool} />;
}

