import { Suspense } from 'react';
import ResetForm from './reset-form';

function LoadingFallback() {
  return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
}

export default function ResetPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Suspense fallback={<LoadingFallback />}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
