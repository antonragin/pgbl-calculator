"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Algo deu errado
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
