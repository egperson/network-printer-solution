import React from "react";

export default function Header({
  query,
  setQuery,
  onRefresh,
  autoRefresh,
  setAutoRefresh,
  searchRef,
  loading,
}) {
  return (
    <header className="flex items-center justify-between px-1" role="banner">
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-white/90 px-3 py-2 rounded bg-transparent">
          Pesquisar
        </div>
        <div className="flex items-center gap-2">
          <span className="mi" aria-hidden>
            search
          </span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar impressora (/)"
            aria-label="Buscar impressora"
            className="px-3 py-2 rounded bg-transparent text-white placeholder:text-white/60 border border-transparent focus:border-white/10"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-white/80">
          Auto: <b>{autoRefresh}s</b>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-2 rounded border border-white/6 text-white"
          aria-pressed={loading}>
          {loading ? "Executando..." : "Atualizar"}
        </button>
        <div
          className="w-10 h-10 rounded bg-transparent flex items-center justify-center"
          aria-hidden>
          <span className="mi">notifications</span>
        </div>
      </div>
    </header>
  );
}
