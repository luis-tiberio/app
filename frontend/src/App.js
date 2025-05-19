import { useState, useEffect, useMemo } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { ptBR } from 'date-fns/locale/pt-BR';
import { format, parse } from 'date-fns';

function parseDateBR(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  return new Date(year, month - 1, day);
}

registerLocale('pt-BR', ptBR);
setDefaultLocale('pt-BR');

const BACKEND_URL = "https://app-backend2-bdfg.onrender.com";
const API = `${BACKEND_URL}/api`;
const WAREHOUSE_CODE = "SOC-SP5";

const sampleVehicles = [ /* ... (mantenha o mesmo array de sampleVehicles) ... */ ];

const getVehicleStatus = (vehicle) => {
  if (!vehicle.eta_destination_realized) return "programado";
  if (vehicle.eta_destination_realized && !vehicle.horario_de_descarga) return "aguardando";
  if (vehicle.horario_de_descarga) return "concluido";
  return vehicle.status || "desconhecido";
};

const getStatusColor = (status) => {
  const colors = {
    "programado": "bg-blue-100 text-blue-800",
    "aguardando": "bg-yellow-100 text-yellow-800",
    "descarregando": "bg-orange-100 text-orange-800",
    "concluido": "bg-green-100 text-green-800",
    "atrasado": "bg-red-100 text-red-800",
    "desconhecido": "bg-gray-100 text-gray-800",
    "no_show": "bg-red-100 text-red-800",
    "infrutifera": "bg-yellow-100 text-yellow-800"
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const StatusChip = ({ status, language }) => {
  const statusMap = {
    pt: {
      "programado": "Programado",
      "aguardando": "Aguardando",
      "descarregando": "Descarregando",
      "concluido": "Concluído",
      "atrasado": "Atrasado",
      "desconhecido": "Desconhecido",
      "no_show": "Não Compareceu",
      "infrutifera": "Infrutífera"
    },
    en: {
      "programado": "Scheduled",
      "aguardando": "Waiting",
      "descarregando": "Unloading",
      "concluido": "Completed",
      "atrasado": "Delayed",
      "desconhecido": "Unknown",
      "no_show": "No Show",
      "infrutifera": "Unproductive"
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {statusMap[language]?.[status] || status}
    </span>
  );
};

const StatusAgrupadoChip = ({ statusAgrupado }) => {
  const colorMap = {
    "ABERTA": "bg-green-100 text-green-800",
    "FECHADA": "bg-blue-100 text-blue-800",
    "NO SHOW": "bg-red-100 text-red-800",
    "INFRUTÍFERA": "bg-yellow-100 text-yellow-800"
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorMap[statusAgrupado] || "bg-gray-100 text-gray-800"}`}>
      {statusAgrupado}
    </span>
  );
};

const LanguageToggle = ({ language, setLanguage }) => {
  return (
    <div className="flex items-center space-x-2">
      <button 
        className={`px-3 py-1 rounded-md text-sm font-medium ${language === 'pt' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        onClick={() => setLanguage('pt')}
      >
        PT
      </button>
      <button 
        className={`px-3 py-1 rounded-md text-sm font-medium ${language === 'en' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
};

const DateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right text-sm text-gray-600">
      <div>{dateTime.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
      <div>{dateTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
    </div>
  );
};

const Header = ({ language, setLanguage, warehouseCode }) => {
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src="/images/shopee-express-logo.png" alt="Logo" className="h-10" />
            <h1 className="ml-4 text-2xl font-bold text-orange-500">Inbound - {warehouseCode}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <DateTime />
            <LanguageToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardStats = ({ counts, language }) => {
  const labels = {
    total: language === 'pt' ? 'Total de Veículos' : 'Total Vehicles',
    scheduled: language === 'pt' ? 'Programados' : 'Scheduled',
    waiting: language === 'pt' ? 'Aguardando' : 'Waiting',
    completed: language === 'pt' ? 'Concluídos' : 'Completed'
  };

  return (
    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(counts).map(([key, value]) => (
        <div key={key} className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${
              key === 'total' ? 'bg-orange-500' :
              key === 'scheduled' ? 'bg-blue-500' :
              key === 'waiting' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
              {/* Ícones mantidos */}
            </div>
            <div className="ml-5">
              <dt className="text-sm font-medium text-gray-500">{labels[key]}</dt>
              <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FilterButtons = ({ 
  language,
  destinations,
  origins,
  selectedDate,
  setSelectedDate,
  selectedDestination,
  selectedOrigin,
  setSelectedDestination,
  setSelectedOrigin
}) => {
  const labels = {
    all: language === 'pt' ? 'Todos' : 'All',
    destination: language === 'pt' ? 'Destino' : 'Destination',
    origin: language === 'pt' ? 'Origem' : 'Origin',
    date: language === 'pt' ? 'Data' : 'Date',
    selectDate: language === 'pt' ? 'Selecionar data' : 'Select date'
  };

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Filtros de Destino, Origem e Data mantidos */}
      </div>
    </div>
  );
};

const SearchAndFilter = ({ 
  onSearchChange, 
  onStatusFilterChange, 
  selectedStatus,
  language
}) => {
  const labels = {
    vehicleList: language === 'pt' ? 'Lista de Veículos' : 'Vehicle List',
    search: language === 'pt' ? 'Pesquisar...' : 'Search...',
    allStatuses: language === 'pt' ? 'Todos os Status' : 'All Statuses',
    scheduled: language === 'pt' ? 'Programados' : 'Scheduled',
    waiting: language === 'pt' ? 'Aguardando' : 'Waiting',
    completed: language === 'pt' ? 'Concluídos' : 'Completed'
  };

  return (
    <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
      <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
        <h3 className="ml-4 mt-2 text-lg leading-6 font-medium text-gray-900">{labels.vehicleList}</h3>
        <div className="ml-4 mt-2 flex-shrink-0 flex space-x-3">
          <select
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            onChange={onStatusFilterChange}
            value={selectedStatus}
          >
            <option value="all">{labels.allStatuses}</option>
            <option value="programado">{labels.scheduled}</option>
            <option value="aguardando">{labels.waiting}</option>
            <option value="concluido">{labels.completed}</option>
          </select>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              className="focus:ring-orange-500 focus:border-orange-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
              placeholder={labels.search}
              onChange={onSearchChange}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VehicleTable = ({ vehicles, language, sortConfig, handleSort }) => {
  const columnKeys = {
    lt: 'trip_number',
    pacotes: 'total_orders',
    statusAgrupado: 'status_agrupado',
    solicitacao: 'solicitation_by',
    destino: 'destination_station_code',
    origem: 'origin_station_code',
    motorista: 'motorista',
    placa: 'license_plate',
    veiculo: 'planned_vehicle',
    etaProgramado: 'eta_destination_scheduled',
    etaRealizado: 'eta_destination_realized',
    descarga: 'horario_de_descarga',
    status: 'status',
    tempoTotal: 'tempo_total'
  };

  const headers = {
    lt: language === 'pt' ? 'LT' : 'LT',
    pacotes: language === 'pt' ? 'Pacotes' : 'Packages',
    statusAgrupado: language === 'pt' ? 'Status Agrupado' : 'Grouped Status',
    solicitacao: language === 'pt' ? 'Solicitação' : 'Solicitation',
    destino: language === 'pt' ? 'Destino' : 'Destination',
    origem: language === 'pt' ? 'Origem' : 'Origin',
    motorista: language === 'pt' ? 'Motorista' : 'Driver',
    placa: language === 'pt' ? 'Placa' : 'License Plate',
    veiculo: language === 'pt' ? 'Veículo' : 'Vehicle',
    etaProgramado: language === 'pt' ? 'ETA Programado' : 'ETA Scheduled',
    etaRealizado: language === 'pt' ? 'ETA Realizado' : 'ETA Realized',
    descarga: language === 'pt' ? 'Descarga' : 'Unloading',
    status: language === 'pt' ? 'Status' : 'Status',
    tempoTotal: language === 'pt' ? 'Tempo Total' : 'Total Time'
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
                    <tr>
            {Object.entries(headers).map(([key, label]) => (
              <th
                key={key}
                onClick={() => handleSort(columnKeys[key])}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-center">
                  {label}
                  {sortConfig.key === columnKeys[key] && (
                    <svg 
                      className={`w-3 h-3 ml-1 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M19 9l-7 7-7-7" 
                      />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedVehicles.map((vehicle) => {
            const status = vehicle.status || getVehicleStatus(vehicle);
            return (
              <tr key={vehicle.trip_number} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  {vehicle.trip_number}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.total_orders || '0'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <StatusAgrupadoChip statusAgrupado={vehicle.status_agrupado} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.solicitation_by}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.destination_station_code}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.origin_station_code}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.motorista}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.license_plate}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.planned_vehicle}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.eta_destination_scheduled || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.eta_destination_realized || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.horario_de_descarga || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <StatusChip status={status} language={language} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {vehicle.tempo_total || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
