import React from "react";

export default function Sidebar({ route, onNavigate }) {
  const NavBtn = ({ icon, label, id }) => (
    <button
      onClick={() => onNavigate(id)}
      className={`nav-item flex items-center gap-2 w-full text-left transition-all ${
        route === id
          ? "opacity-100 bg-white/10"
          : "opacity-70 hover:opacity-100"
      }`}>
      <span className="mi">{icon}</span>
      <span className="hidden md:inline text-sm">{label}</span>
    </button>
  );

  return (
    <aside className=" p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2">
        <img src="../../Logos Simpress-08.png" className="w-10" alt="" />
        {/* <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg"></div> */}
        <div className="hidden md:block">
          <div className="text-sm font-semibold text-white">N.P.S</div>
          <div className="text-xs text-white/80">Network Printer Solution</div>
        </div>
      </div>

      <nav className="flex items-center flex-col flex-1 ">
        <div className="text-ls font-bold px-3 mb-2">PRINCIPAL</div>
        <NavBtn id="dashboard" icon="dashboard" label="Painel" />
        <NavBtn id="devices" icon="print" label="Dispositivos" />

        <div className="text-ls font-bold px-3 mb-2">MONITORAMENTO</div>
        <NavBtn id="health" icon="favorite" label="Saúde" />
        <NavBtn id="analytics" icon="trending_up" label="Análises" />
        <NavBtn id="reports" icon="assessment" label="Relatórios" />
        <NavBtn id="status" icon="info" label="Status" />
        <NavBtn id="support" icon="help" label="Suporte" />

        <div className="text-ls font-bold px-3 mb-2">GERENCIAMENTO</div>
        <NavBtn id="alerts" icon="notification_important" label="Alertas" />
        <NavBtn id="inventory" icon="inventory" label="Inventário" />
        <NavBtn id="reorder" icon="shopping_cart" label="Auto-Reorder" />
        <NavBtn id="maintenance" icon="build" label="Manutenção" />
        <NavBtn id="logs" icon="history" label="Registros" />
        <NavBtn id="settings" icon="settings" label="Configurações" />
      </nav>

      <div className="mt-auto hidden md:block pt-4 border-t border-white/10">
        <div className="text-xs text-white/60">Usuário</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
            L
          </div>
          <div className="text-sm text-white">Administrador</div>
        </div>
      </div>
    </aside>
  );
}
