import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Pagina nao encontrada
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          A pagina que voce procura nao existe.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-700"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
