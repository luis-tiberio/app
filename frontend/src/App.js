import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const GOOGLE_SHEETS_API_KEY = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
const GOOGLE_SHEET_ID = process.env.REACT_APP_GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.REACT_APP_SHEET_NAME;

// Default warehouse code - this would be dynamic in a full implementation
const WAREHOUSE_CODE = "SOC-SP5";

// Sample data structure for initial rendering
const sampleVehicles = [
  {
    trip_number: "LT1O1600296B1",
    solicitation_by: "ANDERSON",
    planned_vehicle: "CAMINHÃO",
    license_plate: "GAQ8J07",
    origin_station_code: "SoC_SP_Campinas",
    destination_station_code: "SOC-SP3",
    eta_destination_scheduled: "06/01/2024 08:00",
    eta_destination_realized: "06/01/2024 08:27",
    horario_de_descarga: "",
    total_orders: "5",
    tempo_total: "00:27",
    status: "aguardando",
    status_agrupado: "ABERTA",
    data_referencia: "06/01/2024",
    motorista: "ANDERSON LEOPOLDINO"
  },
  {
    trip_number: "LT0O15000OI01",
    solicitation_by: "SHOPEE",
    planned_vehicle: "CAMINHÃO",
    license_plate: "GAQ8J07",
    origin_station_code: "SoC_SP_Campinas",
    destination_station_code: "SOC-SP3",
    eta_destination_scheduled: "05/01/2024 09:00",
    eta_destination_realized: "05/01/2024 09:16",
    horario_de_descarga: "",
    total_orders: "8",
    tempo_total: "00:16",
    status: "aguardando",
    status_agrupado: "ABERTA",
    data_referencia: "05/01/2024",
    motorista: "ANDERSON LEOPOLDINO"
  },
  {
    trip_number: "LT0O3M00121D1",
    solicitation_by: "SHOPEE",
    planned_vehicle: "VAN",
    license_plate: "DJB2I63",
    origin_station_code: "SoC_SP_Campinas",
    destination_station_code: "SOC-SP5",
    eta_destination_scheduled: "22/03/2024 22:00",
    eta_destination_realized: "22/03/2024 22:43",
    horario_de_descarga: "22/03/2024 23:52",
    total_orders: "12",
    tempo_total: "01:52",
    status: "concluído",
    status_agrupado: "FECHADA",
    data_referencia: "22/03/2024",
    motorista: "Davi Luiz de Oliveira"
  },
  {
    trip_number: "LT0NCN000NAB1",
    solicitation_by: "FLEX",
    planned_vehicle: "MOTO",
    license_plate: "EXN5H91",
    origin_station_code: "SoC_SP_Campinas",
    destination_station_code: "SOC-SP3",
    eta_destination_scheduled: "23/03/2024 10:00",
    eta_destination_realized: "",
    horario_de_descarga: "",
    total_orders: "3",
    tempo_total: "",
    status: "programado",
    status_agrupado: "NO SHOW",
    data_referencia: "23/03/2024",
    motorista: "WILLIAN PRADO SANCHES FELIX"
  }
];

// Helper function to determine vehicle status
const getVehicleStatus = (vehicle) => {
  // This could be replaced with the status from the API if available
  if (!vehicle.eta_destination_realized) {
    return "programado";
  } else if (vehicle.eta_destination_realized && !vehicle.horario_de_descarga) {
    return "aguardando";
  } else if (vehicle.horario_de_descarga) {
    return "concluido";
  }
  return vehicle.status || "desconhecido";
};

// Helper to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "programado":
      return "bg-blue-100 text-blue-800";
    case "aguardando":
      return "bg-yellow-100 text-yellow-800";
    case "descarregando":
      return "bg-orange-100 text-orange-800";
    case "concluido":
      return "bg-green-100 text-green-800";
    case "atrasado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Status chip component
const StatusChip = ({ status, language }) => {
  // Translate status for display
  let displayStatus = status;
  const statusMap = {
    "pt": {
      "programado": "Programado",
      "aguardando": "Aguardando",
      "descarregando": "Descarregando",
      "concluido": "Concluído",
      "atrasado": "Atrasado",
      "desconhecido": "Desconhecido"
    },
    "en": {
      "programado": "Scheduled",
      "aguardando": "Waiting",
      "descarregando": "Unloading",
      "concluido": "Completed",
      "atrasado": "Delayed",
      "desconhecido": "Unknown"
    }
  };
  
  if (statusMap[language] && statusMap[language][status]) {
    displayStatus = statusMap[language][status];
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {displayStatus}
    </span>
  );
};

// Status Agrupado Chip
const StatusAgrupadoChip = ({ statusAgrupado }) => {
  // Define color schemes for each status
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

// Language Toggle Component
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

// DateTime Component using São Paulo timezone
const DateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format date and time according to São Paulo/Brazil locale
  const formattedDate = dateTime.toLocaleDateString('pt-BR', { 
    timeZone: 'America/Sao_Paulo' 
  });
  
  const formattedTime = dateTime.toLocaleTimeString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return (
    <div className="text-right text-sm text-gray-600">
      <div>{formattedDate}</div>
      <div>{formattedTime}</div>
    </div>
  );
};

// Header Component
const Header = ({ language, setLanguage, warehouseCode }) => {
  const title = language === 'pt' ? 'Inbound' : 'Inbound';
  
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img 
              src="/images/shopee-express-logo.png" 
              alt="ShopeeXPRESS Logo" 
              className="h-10"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-orange-500">
                {title} - {warehouseCode}
              </h1>
            </div>
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

// Dashboard Stats Component
const DashboardStats = ({ counts, language }) => {
  const labels = {
    total: language === 'pt' ? 'Total de Veículos' : 'Total Vehicles',
    scheduled: language === 'pt' ? 'Programados' : 'Scheduled',
    waiting: language === 'pt' ? 'Aguardando' : 'Waiting',
    completed: language === 'pt' ? 'Concluídos' : 'Completed'
  };
  
  return (
    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{labels.total}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{counts.total}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{labels.scheduled}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{counts.scheduled}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{labels.waiting}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{counts.waiting}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{labels.completed}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{counts.completed}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Filter Buttons Component
const FilterButtons = ({ 
  language, 
  destinations,
  origins,
  dates,
  selectedDestination,
  selectedOrigin,
  selectedDate,
  setSelectedDestination,
  setSelectedOrigin,
  setSelectedDate
}) => {
  const labels = {
    all: language === 'pt' ? 'Todos' : 'All',
    destination: language === 'pt' ? 'Destino' : 'Destination',
    origin: language === 'pt' ? 'Origem' : 'Origin',
    date: language === 'pt' ? 'Data' : 'Date'
  };
  
  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center">
          <label htmlFor="destination-select" className="mr-2 text-sm font-medium text-gray-700">
            {labels.destination}:
          </label>
          <select
            id="destination-select"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
          >
            <option value="all">{labels.all}</option>
            {destinations.map((dest) => (
              <option key={dest} value={dest}>{dest}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <label htmlFor="origin-select" className="mr-2 text-sm font-medium text-gray-700">
            {labels.origin}:
          </label>
          <select
            id="origin-select"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          >
            <option value="all">{labels.all}</option>
            {origins.map((origin) => (
              <option key={origin} value={origin}>{origin}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <label htmlFor="date-select" className="mr-2 text-sm font-medium text-gray-700">
            {labels.date}:
          </label>
          <select
            id="date-select"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="all">{labels.all}</option>
            {dates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// Search and Filter Component
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
        <div className="ml-4 mt-2">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{labels.vehicleList}</h3>
        </div>
        <div className="ml-4 mt-2 flex-shrink-0">
          <div className="flex space-x-3">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
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
    </div>
  );
};

// Vehicle Table Component
const VehicleTable = ({ vehicles, language }) => {
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
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.lt}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.pacotes}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.statusAgrupado}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.solicitacao}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.destino}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.origem}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.motorista}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.placa}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.veiculo}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.etaProgramado}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.etaRealizado}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.descarga}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.status}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.tempoTotal}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => {
                  const status = vehicle.status || getVehicleStatus(vehicle);
                  return (
                    <tr key={vehicle.trip_number} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.trip_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.total_orders || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusAgrupadoChip statusAgrupado={vehicle.status_agrupado} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.solicitation_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.destination_station_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.origin_station_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.motorista}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.planned_vehicle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.eta_destination_scheduled || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.eta_destination_realized || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.horario_de_descarga || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusChip status={status} language={language} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.tempo_total || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [filteredVehicles, setFilteredVehicles] = useState(sampleVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [language, setLanguage] = useState('pt'); // Default to Portuguese
  const [warehouseCode, setWarehouseCode] = useState(WAREHOUSE_CODE);
  const [loading, setLoading] = useState(true);
  
  // Additional filters
  const [selectedDestination, setSelectedDestination] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  
  // Extract unique values for filters
  const destinations = [...new Set(vehicles.map(v => v.destination_station_code))];
  const origins = [...new Set(vehicles.map(v => v.origin_station_code))];
  const dates = [...new Set(vehicles.map(v => v.data_referencia))];

  // Count vehicles by status
  const counts = {
    total: vehicles.length,
    scheduled: vehicles.filter(v => v.status === 'programado' || getVehicleStatus(v) === 'programado').length,
    waiting: vehicles.filter(v => v.status === 'aguardando' || getVehicleStatus(v) === 'aguardando').length,
    completed: vehicles.filter(v => v.status === 'concluido' || getVehicleStatus(v) === 'concluido').length
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Apply all filters
  useEffect(() => {
    let filtered = vehicles;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.status === statusFilter || getVehicleStatus(vehicle) === statusFilter
      );
    }
    
    // Apply destination filter
    if (selectedDestination !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.destination_station_code === selectedDestination
      );
    }
    
    // Apply origin filter
    if (selectedOrigin !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.origin_station_code === selectedOrigin
      );
    }
    
    // Apply date filter
    if (selectedDate !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.data_referencia === selectedDate
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        (vehicle.trip_number?.toLowerCase().includes(term) || false) ||
        (vehicle.planned_vehicle?.toLowerCase().includes(term) || false) ||
        (vehicle.license_plate?.toLowerCase().includes(term) || false) ||
        (vehicle.motorista?.toLowerCase().includes(term) || false) ||
        (vehicle.origin_station_code?.toLowerCase().includes(term) || false) ||
        (vehicle.destination_station_code?.toLowerCase().includes(term) || false)
      );
    }
    
    setFilteredVehicles(filtered);
  }, [searchTerm, statusFilter, selectedDestination, selectedOrigin, selectedDate, vehicles]);

  // Fetch data from Google Sheets API
  const fetchGoogleSheetsData = async () => {
    try {
      setLoading(true);
      console.log("Fetching data from Google Sheets API...");
      
      // Construct the Google Sheets API URL
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`;
      
      // Fetch the data
      const response = await axios.get(sheetsUrl);
      
      // Check if we got valid data
      if (response.data && response.data.values && response.data.values.length > 1) {
        // Extract headers and data
        const headers = response.data.values[0];
        const rows = response.data.values.slice(1);
        
        // Map the data to our vehicle structure
        const vehicles = rows.map(row => {
          const vehicle = {};
          
          // Map each column based on its header
          headers.forEach((header, index) => {
            const value = row[index] || '';
            
            // Map headers to our vehicle property names
            switch(header.toLowerCase()) {
              case 'trip_number':
              case 'lt':
                vehicle.trip_number = value;
                break;
              case 'solicitation_by':
              case 'solicitação':
                vehicle.solicitation_by = value;
                break;
              case 'planned_vehicle':
              case 'veículo':
                vehicle.planned_vehicle = value;
                break;
              case 'license_plate':
              case 'placa':
                vehicle.license_plate = value;
                break;
              case 'origin_station_code':
              case 'origem':
                vehicle.origin_station_code = value;
                break;
              case 'destination_station_code':
              case 'destino':
                vehicle.destination_station_code = value;
                break;
              case 'eta_destination_scheduled':
              case 'eta programado':
                vehicle.eta_destination_scheduled = value;
                break;
              case 'eta_destination_realized':
              case 'eta realizado':
                vehicle.eta_destination_realized = value;
                break;
              case 'horario_de_descarga':
              case 'descarga':
                vehicle.horario_de_descarga = value;
                break;
              case 'total_orders':
              case 'pacotes':
                vehicle.total_orders = value;
                break;
              case 'tempo_total':
              case 'tempo total':
                vehicle.tempo_total = value;
                break;
              case 'status':
                vehicle.status = value.toLowerCase();
                break;
              case 'status_agrupado':
              case 'status agrupado':
                vehicle.status_agrupado = value;
                break;
              case 'data_referencia':
              case 'data':
                vehicle.data_referencia = value;
                break;
              case 'motorista':
                vehicle.motorista = value;
                break;
              default:
                // Handle any other columns
                vehicle[header.toLowerCase().replace(/\s+/g, '_')] = value;
            }
          });
          
          return vehicle;
        });
        
        // Update state with the fetched data
        setVehicles(vehicles);
      } else {
        console.error("Invalid data format from Google Sheets API");
        // Fallback to sample data if API response is invalid
        setVehicles(sampleVehicles);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
      // Fallback to sample data on error
      setVehicles(sampleVehicles);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleSheetsData();
    
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(fetchGoogleSheetsData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        language={language} 
        setLanguage={setLanguage} 
        warehouseCode={warehouseCode} 
      />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <DashboardStats counts={counts} language={language} />
          
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <SearchAndFilter 
                onSearchChange={handleSearchChange} 
                onStatusFilterChange={handleStatusFilterChange}
                selectedStatus={statusFilter}
                language={language}
              />
              
              <FilterButtons 
                language={language}
                destinations={destinations}
                origins={origins}
                dates={dates}
                selectedDestination={selectedDestination}
                selectedOrigin={selectedOrigin}
                selectedDate={selectedDate}
                setSelectedDestination={setSelectedDestination}
                setSelectedOrigin={setSelectedOrigin}
                setSelectedDate={setSelectedDate}
              />
              
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <VehicleTable 
                  vehicles={filteredVehicles}
                  language={language}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
