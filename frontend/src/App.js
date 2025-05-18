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
    planned_vehicle: "GAQ8J07",
    origin_station_code: "SoC_SP_Campinas",
    destination_station_code: "SOC-SP3",
    eta_destination_scheduled: "06/01/2024 08:00",
    eta_destination_realized: "06/01/2024 08:27",
    horario_de_descarga: "",
    total_orders: "5",
    tempo_total: "00:27",
    status: "waiting",
    data_referencia: "06/01/2024",
    motorista: "ANDERSON LEOPOLDINO"
  },
  {
    trip_number: "LT0O15000OI01",
    solicitation_by: "SHOPEE",
    planned_vehicle: "GAQ8J07",
    origin_station_code: "SoC_SP_Campinas",
    destination_station_code: "SOC-SP3",
    eta_destination_scheduled: "05/01/2024 09:00",
    eta_destination_realized: "05/01/2024 09:16",
    horario_de_descarga: "",
    total_orders: "8",
    tempo_total: "00:16",
    status: "waiting",
    data_referencia: "05/01/2024",
    motorista: "ANDERSON LEOPOLDINO"
  }
];

// Helper function to determine vehicle status
const getVehicleStatus = (vehicle) => {
  // This is a simplified status determination based on available fields
  // In a real implementation, this would be more sophisticated
  if (!vehicle.eta_destination_realized) {
    return "scheduled";
  } else if (vehicle.eta_destination_realized && !vehicle.horario_de_descarga) {
    return "waiting";
  } else if (vehicle.horario_de_descarga) {
    return "completed";
  }
  return vehicle.status || "unknown";
};

// Helper to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "waiting":
      return "bg-yellow-100 text-yellow-800";
    case "unloading":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "atrasado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Status chip component
const StatusChip = ({ status }) => {
  // Translate status for display if needed
  let displayStatus = status;
  const statusMap = {
    "scheduled": "Programado",
    "waiting": "Aguardando",
    "unloading": "Descarregando",
    "completed": "Concluído",
    "atrasado": "Atrasado"
  };
  
  if (statusMap[status]) {
    displayStatus = statusMap[status];
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {displayStatus}
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
    <div className="text-sm text-gray-600">
      {formattedDate} {formattedTime}
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
              <h1 className="text-xl font-bold text-gray-900">
                {title} - {warehouseCode}
              </h1>
              <DateTime />
            </div>
          </div>
          <LanguageToggle language={language} setLanguage={setLanguage} />
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

// Search and Filter Component
const SearchAndFilter = ({ onSearchChange, onStatusFilterChange, selectedStatus, language }) => {
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
              <option value="scheduled">{labels.scheduled}</option>
              <option value="waiting">{labels.waiting}</option>
              <option value="completed">{labels.completed}</option>
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
    status: language === 'pt' ? 'Status' : 'Status',
    tripNumber: language === 'pt' ? 'LT' : 'Trip Number',
    vehicleAndDriver: language === 'pt' ? 'Veículo & Motorista' : 'Vehicle & Driver',
    arrivalTime: language === 'pt' ? 'ETA Realizado' : 'Actual Arrival',
    origin: language === 'pt' ? 'Origem' : 'Origin',
    destination: language === 'pt' ? 'Destino' : 'Destination',
    unloadingTime: language === 'pt' ? 'Descarga' : 'Unloading Time',
    packages: language === 'pt' ? 'Pacotes' : 'Packages',
    totalTime: language === 'pt' ? 'Tempo Total' : 'Total Time'
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
                    {headers.status}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.tripNumber}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.vehicleAndDriver}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.arrivalTime}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.origin}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.destination}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.unloadingTime}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.packages}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {headers.totalTime}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => {
                  const status = getVehicleStatus(vehicle);
                  return (
                    <tr key={vehicle.trip_number} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusChip status={status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.trip_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vehicle.planned_vehicle}</div>
                            <div className="text-sm text-gray-500">{vehicle.motorista}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.eta_destination_realized || language === 'pt' ? 'Não chegou' : 'Not arrived'}
                        </div>
                        {vehicle.eta_destination_scheduled && (
                          <div className="text-sm text-gray-500">
                            {language === 'pt' ? 'Programado: ' : 'Scheduled: '}
                            {vehicle.eta_destination_scheduled}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.origin_station_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.destination_station_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.horario_de_descarga || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.total_orders || '0'}
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

  // Count vehicles by status
  const counts = {
    total: vehicles.length,
    scheduled: vehicles.filter(v => getVehicleStatus(v) === 'scheduled').length,
    waiting: vehicles.filter(v => getVehicleStatus(v) === 'waiting').length,
    completed: vehicles.filter(v => getVehicleStatus(v) === 'completed').length
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Apply filters
  useEffect(() => {
    let filtered = vehicles;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => getVehicleStatus(vehicle) === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        (vehicle.trip_number?.toLowerCase().includes(term) || false) ||
        (vehicle.planned_vehicle?.toLowerCase().includes(term) || false) ||
        (vehicle.motorista?.toLowerCase().includes(term) || false) ||
        (vehicle.origin_station_code?.toLowerCase().includes(term) || false) ||
        (vehicle.destination_station_code?.toLowerCase().includes(term) || false)
      );
    }
    
    setFilteredVehicles(filtered);
  }, [searchTerm, statusFilter, vehicles]);

  // Fetch data from Google Sheets API
  const fetchGoogleSheetsData = async () => {
    try {
      setLoading(true);
      // In a production app, this API call would be proxied through the backend for security
      // For now, we're simulating the data load
      console.log("Fetching data from Google Sheets API...");
      
      // Here we would make the actual API call to Google Sheets
      // const response = await axios.get(
      //   `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`
      // );
      
      // Process the data from Google Sheets
      // const data = response.data.values;
      // const headers = data[0];
      // const rows = data.slice(1);
      
      // In a real implementation, we would parse the Google Sheets data
      // and transform it into our vehicle data structure
      
      // For now, we'll just use our sample data
      setTimeout(() => {
        setVehicles(sampleVehicles);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
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
