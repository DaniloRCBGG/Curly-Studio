"use client";

// Apagar remove as fotos do Storage de vez: pede confirmação antes.
export function BotaoApagar() {
  return (
    <button
      className="rounded-full px-3 py-2 text-sm text-red-800 hover:bg-red-50"
      onClick={(e) => {
        if (!window.confirm("Apagar estas fotos do site? Não dá para desfazer.")) e.preventDefault();
      }}
    >
      Apagar
    </button>
  );
}
